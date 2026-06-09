from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination
from handyman.auth import DualJWTAuthentication
from .models import Wallet, Transaction, Payment
from .serializers import WalletSerializer, TransactionSerializer
from handymen.models import Handyman
from django.db.models import Sum

class TransactionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'limit'
    max_page_size = 50

class WalletDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

    def get(self, request):
        user = request.user
        if isinstance(user, Handyman):
            wallet, _ = Wallet.objects.get_or_create(handyman=user)
        else:
            wallet, _ = Wallet.objects.get_or_create(user=user)
        
        serializer = WalletSerializer(wallet, context={'request': request})
        return Response(serializer.data)


class TransactionListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]
    serializer_class = TransactionSerializer
    pagination_class = TransactionPagination

    def get_queryset(self):
        user = self.request.user
        if isinstance(user, Handyman):
            wallet, _ = Wallet.objects.get_or_create(handyman=user)
        else:
            wallet, _ = Wallet.objects.get_or_create(user=user)
        return wallet.transactions.all()


from django.views.generic import TemplateView
from django.contrib.auth.mixins import UserPassesTestMixin

class AdminFinancialOverviewView(APIView):
    permission_classes = [permissions.IsAdminUser]
    authentication_classes = [DualJWTAuthentication]

    def get(self, request):
        total_gross = Payment.objects.filter(status='collected').aggregate(Sum('gross_amount'))['gross_amount__sum'] or 0
        total_commissions = Payment.objects.filter(status='collected').aggregate(Sum('platform_fee'))['platform_fee__sum'] or 0
        return Response({
            'total_gross': total_gross,
            'total_platform_fees': total_commissions,
            'total_handyman_payouts': total_gross - total_commissions
        })

class WithdrawalDashboardView(UserPassesTestMixin, TemplateView):
    template_name = 'admin/payments/withdrawal_dashboard.html'
    
    def test_func(self):
        return self.request.user.is_staff
