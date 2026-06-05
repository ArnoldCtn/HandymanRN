"""
Gemini-powered national ID verification for handymen (Cameroon front + back).
"""
import base64
import json
import os
import re
from datetime import date, datetime
from difflib import SequenceMatcher

from django.conf import settings
from django.utils import timezone

from .models import Handyman

NAME_MATCH_THRESHOLD = 0.85
MIN_AGE = 18
GEMINI_MODEL = 'gemini-flash-latest'

def decode_base64_image(data):
    """
    Decode a data-URL base64 image string from the mobile app.
    Returns (bytes, mime_type).
    """
    if not isinstance(data, str) or not data.strip():
        raise ValueError('Image data is required.')
    data = data.strip()
    if not data.startswith('data:image/'):
        raise ValueError('Invalid image format. Expected data:image/...;base64,...')
    try:
        header, imgstr = data.split(';base64,', 1)
    except ValueError:
        raise ValueError('Invalid base64 image data.')
    mime_type = header.replace('data:', '').strip() or 'image/jpeg'
    try:
        image_bytes = base64.b64decode(imgstr, validate=True)
    except Exception as e:
        raise ValueError(f'Could not decode image: {e}') from e
    if not image_bytes:
        raise ValueError('Image file is empty.')
    return image_bytes, mime_type


EXTRACTION_PROMPT = """You are an expert OCR assistant for Cameroon national identity cards (CNI).
You will receive TWO images: the FRONT and the BACK of the same ID card.

Extract information visible on either side and return ONLY a valid JSON object with these keys:
- "username": full legal name of the holder (string, as printed on the card)
- "username_front": name text visible on the front image (string, or null)
- "username_back": name text visible on the back image (string, or null)
- "id_number": national ID number (string)
- "birth_date": date of birth in YYYY-MM-DD format (string)
- "gender": exactly "male" or "female" (lowercase string)

Rules:
- Use null for any field you cannot read clearly.
- Do not invent data.
- No markdown, no explanation — JSON only."""


def _normalize_name(value):
    value = (value or '').strip().lower()
    value = re.sub(r'[^a-z\s]', '', value)
    return ' '.join(value.split())


def name_similarity(a, b):
    a = _normalize_name(a)
    b = _normalize_name(b)
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def _parse_gemini_json(text):
    text = (text or '').strip()
    if text.startswith('```'):
        text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s*```\s*$', '', text)
    return json.loads(text)


def _parse_date(value):
    if value is None:
        return None
    if isinstance(value, date):
        return value
    s = str(value).strip()
    if not s:
        return None
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y'):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    raise ValueError('Could not parse birth date from ID card.')


def calculate_age(birth_date):
    today = date.today()
    years = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        years -= 1
    return years


def _normalize_gender(value):
    g = (value or '').strip().lower()
    if g in ('m', 'male', 'homme', 'h'):
        return 'male'
    if g in ('f', 'female', 'femme', 'f'):
        return 'female'
    return g


def _check_duplicate_id_number(id_number, exclude_handyman_id=None):
    if not id_number:
        raise ValueError('Could not read ID number from your card. Please retake clearer photos.')
    qs = Handyman.objects.filter(id_number__iexact=str(id_number).strip())
    if exclude_handyman_id:
        qs = qs.exclude(pk=exclude_handyman_id)
    if qs.exists():
        raise ValueError(
            'This ID number is already linked to another account. '
            'Duplicate IDs are not allowed.'
        )


def _validate_name_match(form_name, extracted):
    primary = extracted.get('username') or ''
    front = extracted.get('username_front') or primary
    back = extracted.get('username_back') or primary

    scores = []
    for candidate in (primary, front, back):
        if candidate:
            scores.append(name_similarity(form_name, candidate))

    if not scores:
        raise ValueError('Could not read your name from the ID card.')

    # Require both front and back name reads to match when both are present
    if extracted.get('username_front') and extracted.get('username_back'):
        front_score = name_similarity(form_name, extracted['username_front'])
        back_score = name_similarity(form_name, extracted['username_back'])
        if front_score < NAME_MATCH_THRESHOLD or back_score < NAME_MATCH_THRESHOLD:
            raise ValueError(
                f'Name on your ID does not match what you entered '
                f'(front: {int(front_score * 100)}%, back: {int(back_score * 100)}%; '
                f'required {int(NAME_MATCH_THRESHOLD * 100)}%).'
            )
        return extracted['username'] or extracted['username_front']

    best = max(scores)
    if best < NAME_MATCH_THRESHOLD:
        raise ValueError(
            f'Name on your ID does not match what you entered '
            f'({int(best * 100)}% match; required {int(NAME_MATCH_THRESHOLD * 100)}%).'
        )
    return primary or front or back


def _call_gemini(front_bytes, front_mime, back_bytes, back_mime):
    api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError('ID verification is not configured (missing GEMINI_API_KEY).')

    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=[
            types.Part.from_bytes(data=front_bytes, mime_type=front_mime or 'image/jpeg'),
            types.Part.from_bytes(data=back_bytes, mime_type=back_mime or 'image/jpeg'),
            EXTRACTION_PROMPT,
        ],
        config=types.GenerateContentConfig(
            response_mime_type='application/json',
            temperature=0.1,
        ),
    )
    text = response.text
    if not text:
        raise ValueError('Gemini returned an empty response. Please try again.')
    return _parse_gemini_json(text)


def _mock_extraction(form_name, form_birth_date, form_gender):
    """Dev-only path when ID_VERIFICATION_MOCK=true in environment."""
    bd = _parse_date(form_birth_date)
    return {
        'username': form_name,
        'username_front': form_name,
        'username_back': form_name,
        'id_number': f'MOCK-{int(timezone.now().timestamp())}',
        'birth_date': bd.isoformat() if bd else None,
        'gender': _normalize_gender(form_gender),
    }


def verify_id_card(
    *,
    form_name,
    form_birth_date,
    form_gender,
    front_bytes,
    front_mime='image/jpeg',
    back_bytes,
    back_mime='image/jpeg',
    exclude_handyman_id=None,
):
    """
    Verify ID card images against form data. Returns dict with legal_name, id_number,
    birth_date, gender, age. Raises ValueError on failure.
    """
    if not front_bytes or not back_bytes:
        raise ValueError('Both front and back ID card photos are required.')

    form_birth = _parse_date(form_birth_date)
    if not form_birth:
        raise ValueError('Birth date is required (YYYY-MM-DD).')

    form_gender_norm = _normalize_gender(form_gender)
    if form_gender_norm not in ('male', 'female'):
        raise ValueError('Gender must be male or female.')

    use_mock = os.getenv('ID_VERIFICATION_MOCK', '').lower() in ('1', 'true', 'yes')
    if use_mock:
        extracted = _mock_extraction(form_name, form_birth, form_gender_norm)
    else:
        extracted = _call_gemini(front_bytes, front_mime, back_bytes, back_mime)

    legal_name = _validate_name_match(form_name, extracted)

    extracted_birth = _parse_date(extracted.get('birth_date'))
    if not extracted_birth:
        raise ValueError('Could not read date of birth from ID card.')

    age = calculate_age(extracted_birth)
    if age < MIN_AGE:
        raise ValueError('You must be at least 18 years old to register as a handyman.')

    if extracted_birth != form_birth:
        raise ValueError(
            'Birth date on your ID does not match the date on your profile. '
            'Update your profile or use the correct ID.'
        )

    extracted_gender = _normalize_gender(extracted.get('gender'))
    if extracted_gender and extracted_gender in ('male', 'female'):
        if extracted_gender != form_gender_norm:
            raise ValueError(
                f'Gender on your ID ({extracted_gender}) does not match your profile ({form_gender_norm}).'
            )

    id_number = (extracted.get('id_number') or '').strip()
    _check_duplicate_id_number(id_number, exclude_handyman_id=exclude_handyman_id)

    return {
        'legal_name': legal_name.strip(),
        'id_number': id_number,
        'birth_date': extracted_birth,
        'gender': extracted_gender or form_gender_norm,
        'age': age,
    }
