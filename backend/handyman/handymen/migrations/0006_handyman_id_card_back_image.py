from django.db import migrations, models
import handymen.models


class Migration(migrations.Migration):

    dependencies = [
        ('handymen', '0005_handyman_id_verification_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='handyman',
            name='id_card_back_image',
            field=models.ImageField(
                blank=True,
                help_text='Back of national ID card',
                null=True,
                upload_to=handymen.models.upload_handyman_id_card_back,
            ),
        ),
    ]
