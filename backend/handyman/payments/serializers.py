from rest_framework import serializers
from .models import Payment, Wallet, Transaction
from handymen.serializers import HandymanSerializer
from users.serializers import UserSerializer

class TransactionSerializer(serializers.ModelSerializer):
    related_handyman_info = serializers.SerializerMethodField()
    related_user_info = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'amount', 'transaction_type', 'status', 
            'description', 'created_at', 'related_handyman_info', 'related_user_info'
        ]

    def get_related_handyman_info(self, obj):
        if obj.related_handyman:
            return {
                'id': obj.related_handyman.id,
                'username': obj.related_handyman.username,
                'thumbnail': obj.related_handyman.thumbnail.url if obj.related_handyman.thumbnail else None
            }
        return None

    def get_related_user_info(self, obj):
        if obj.related_user:
            return {
                'id': obj.related_user.id,
                'username': obj.related_user.username,
                'thumbnail': obj.related_user.thumbnail.url if obj.related_user.thumbnail else None
            }
        return None

class WalletSerializer(serializers.ModelSerializer):
    transactions = serializers.SerializerMethodField()

    class Meta:
        model = Wallet
        fields = [
            'balance', 'total_earned_gross', 'total_earned_net', 
            'total_app_commissions', 'transactions'
        ]

    def get_transactions(self, obj):
        # We'll use pagination in the view, but this is a fallback
        qs = obj.transactions.all()[:10]
        return TransactionSerializer(qs, many=True).data
