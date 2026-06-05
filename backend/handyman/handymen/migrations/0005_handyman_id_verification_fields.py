# Generated manually for ID verification feature

from django.db import migrations, models
import handymen.models


class Migration(migrations.Migration):

    dependencies = [
        ('handymen', '0004_handyman_subscription_level'),
    ]

    operations = [
        migrations.AddField(
            model_name='handyman',
            name='legal_name',
            field=models.CharField(
                blank=True,
                help_text='Full legal name as printed on the government ID',
                max_length=255,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='handyman',
            name='birth_date',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='handyman',
            name='gender',
            field=models.CharField(
                choices=[('male', 'Male'), ('female', 'Female')],
                default='male',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='handyman',
            name='id_number',
            field=models.CharField(
                blank=True,
                help_text='National ID number extracted from ID card',
                max_length=64,
                null=True,
                unique=True,
            ),
        ),
        migrations.AddField(
            model_name='handyman',
            name='id_card_image',
            field=models.ImageField(
                blank=True,
                help_text='Front of national ID card',
                null=True,
                upload_to=handymen.models.upload_handyman_id_card_front,
            ),
        ),
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
        migrations.AddField(
            model_name='handyman',
            name='id_verification_status',
            field=models.CharField(
                choices=[
                    ('pending', 'Pending'),
                    ('verified', 'Verified'),
                    ('failed', 'Failed'),
                ],
                default='pending',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='handyman',
            name='id_verified_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='handyman',
            name='availability',
            field=models.JSONField(blank=True, default=dict, null=True),
        ),
    ]
