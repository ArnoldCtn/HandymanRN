from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from allauth.socialaccount.models import SocialAccount
import requests
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model

@api_view(['POST'])
@permission_classes([AllowAny])
def google_oauth_login(request):
    """
    Handle Google OAuth login for CLIENT users only
    Captures email, profile picture, and sets user_type to 'client'
    """
    try:
        # Get tokens from React Native app
        raw_id_token = request.data.get('id_token')
        access_token = request.data.get('access_token')
        
        if not raw_id_token:
            return Response({'error': 'ID token required'}, status=400)
        
        # Verify Google token
        from google.auth.transport.requests import Request
        from google.oauth2 import id_token as google_id_token
        
        request_obj = Request()
        idinfo = google_id_token.verify_oauth2_token(raw_id_token, request_obj)
        
        # Get or create user - CLIENT ONLY
        User = get_user_model()
        
        user, created = User.objects.get_or_create(
            email=idinfo['email'],
            defaults={
                'first_name': idinfo.get('given_name', ''),
                'last_name': idinfo.get('family_name', ''),
                'username': idinfo['email'],
                'user_type': 'client',  # Force client type
            }
        )
        
        # Ensure user_type is always 'client' for Google OAuth
        if user.user_type != 'client':
            user.user_type = 'client'
            user.save()
        
        # Update profile picture if available
        if idinfo.get('picture'):
            try:
                response = requests.get(idinfo['picture'])
                if response.status_code == 200:
                    image_content = response.content
                    image_file = SimpleUploadedFile(
                        f"{user.username}_profile.jpg",
                        image_content,
                        content_type="image/jpeg"
                    )
                    user.thumbnail = image_file
                    user.save()
            except Exception as img_error:
                print(f"Error saving profile picture: {img_error}")
        
        # Create or update social account
        social_account, _ = SocialAccount.objects.get_or_create(
            user=user,
            provider='google',
            uid=idinfo['sub']
        )
        
        # Use consistent auth response structure
        from .views import get_auth_for_user
        response_data = get_auth_for_user(user, request)
        response_data['created'] = created
        
        return Response(response_data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=400)
