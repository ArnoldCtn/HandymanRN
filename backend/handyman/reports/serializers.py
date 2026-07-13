from rest_framework import serializers
from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    handyman_username = serializers.CharField(source='reported_handyman.username', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'reporter_username', 'reported_handyman', 'handyman_username',
            'reason', 'additional_details', 'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['reporter', 'status', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['reporter'] = self.context['request'].user
        return super().create(validated_data)