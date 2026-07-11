# HandymanRN — All Models Reference

## 1. `users` app → Table: **`users_user`**

### Model: **User** (extends `AbstractUser`)

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `password` | CharField(128) | |
| `last_login` | DateTimeField | nullable |
| `is_superuser` | BooleanField | |
| `username` | CharField(150) | **unique** |
| `first_name` | CharField(150) | |
| `last_name` | CharField(150) | |
| `is_staff` | BooleanField | |
| `is_active` | BooleanField | |
| `date_joined` | DateTimeField | |
| `user_type` | CharField(20) | choices: `'client'`; nullable |
| `thumbnail` | ImageField | nullable, upload_to='thumbnails/' |
| `email` | CharField(254) | **unique** |
| `is_online` | BooleanField | default=False |
| `last_seen` | DateTimeField | nullable |
| `two_fa_enabled` | BooleanField | default=False |
| `two_fa_secret` | CharField(64) | nullable |

---

## 2. `users` app → Table: **`users_passwordresetotp`**

### Model: **PasswordResetOTP**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `email` | EmailField | |
| `otp_code` | CharField(6) | auto-generated random 6-digit |
| `expires_at` | DateTimeField | default: now + 5 min |
| `created_at` | DateTimeField | auto_now_add |
| `user_type` | CharField(20) | choices: `'user'`, `'handyman'`; default=`'user'` |
| `ip_address` | GenericIPAddressField | nullable |
| `user_agent` | TextField | nullable |
| `attempts` | IntegerField | default=0 |
| `max_attempts` | IntegerField | default=3 |
| `is_used` | BooleanField | default=False |
| `verified_at` | DateTimeField | nullable |

---

## 3. `handymen` app → Table: **`handymen_handyman`**

### Model: **Handyman** (extends `AbstractBaseUser` + `PermissionsMixin`)

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `password` | CharField(128) | |
| `last_login` | DateTimeField | nullable |
| `is_superuser` | BooleanField | |
| `username` | CharField(150) | **unique** |
| `email` | EmailField | **unique** |
| `phone` | CharField(20) | nullable |
| `legal_name` | CharField(255) | nullable (legal name on gov't ID) |
| `birth_date` | DateField | nullable |
| `gender` | CharField(10) | choices: `'male'`, `'female'`; default=`'male'` |
| `id_number` | CharField(64) | **unique**, nullable (national ID number) |
| `id_card_image` | ImageField | nullable (front of ID card) |
| `id_card_back_image` | ImageField | nullable (back of ID card) |
| `id_verification_status` | CharField(20) | choices: `'pending'`, `'verified'`, `'failed'`; default=`'pending'` |
| `id_verified_at` | DateTimeField | nullable |
| `bio` | TextField | nullable |
| `availability` | JSONField | nullable, default=dict |
| `thumbnail` | ImageField | nullable, upload_to='handyman_thumbnails/' |
| `location` | **FK → Location** | SET_NULL, nullable, related_name='handymen' |
| `services` | **M2M → Service** | related_name='handymen' |
| `average_rating` | DecimalField(3,2) | nullable (1.00–10.00) |
| `total_ratings` | PositiveIntegerField | default=0 |
| `is_online` | BooleanField | default=False |
| `last_seen` | DateTimeField | nullable |
| `is_available` | BooleanField | default=True |
| `is_verified` | BooleanField | default=False (admin approval) |
| `subscription_level` | CharField(20) | choices: `'free'`, `'pro'`, `'premium'`; default=`'free'` |
| `two_fa_enabled` | BooleanField | default=False |
| `two_fa_secret` | CharField(64) | nullable |
| `is_active` | BooleanField | default=True |
| `is_staff` | BooleanField | default=False |
| `date_joined` | DateTimeField | default=timezone.now |
| `groups` | **M2M → auth.Group** | related_name='handyman_set' |
| `user_permissions` | **M2M → auth.Permission** | related_name='handyman_set' |

---

## 4. `handymen` app → Table: **`handymen_jobpicture`**

### Model: **JobPicture**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `handyman` | **FK → Handyman** | CASCADE, related_name='job_pictures' |
| `image` | ImageField | upload_to='job_pictures/' |
| `description` | CharField(255) | nullable |
| `created_at` | DateTimeField | auto_now_add |

---

## 5. `services` app → Table: **`services_service`**

### Model: **Service**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `name` | CharField(100) | |
| `description` | TextField | |
| `image` | ImageField | nullable, upload_to='services/' |
| `created_by` | **FK → User** | CASCADE, related_name='services' |
| `created_at` | DateTimeField | auto_now_add |

---

## 6. `locations` app → Table: **`locations_location`**

### Model: **Location**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `location` | CharField(100) | (town/city name) |
| `region` | CharField(100) | default='West Region Cameroon' |
| `handyman_per_location` | CharField | nullable |
| `created_at` | DateTimeField | auto_now_add |

---

## 7. `bookings` app → Table: **`bookings_booking`**

### Model: **Booking**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `user` | **FK → User** | CASCADE, related_name='bookings_as_user' |
| `handyman` | **FK → Handyman** | CASCADE, related_name='bookings_as_handyman' |
| `service` | **FK → Service** | PROTECT |
| `location` | **FK → Location** | PROTECT, nullable |
| `scheduled_date` | DateTimeField | (date + time for the job) |
| `job_description` | TextField | nullable |
| `total_amount` | DecimalField(12,2) | default=0.00 |
| `status` | CharField(20) | choices: `'pending'`, `'accepted'`, `'declined'`, `'completed'`, `'cancelled'`, `'paid'`; default=`'pending'` |
| `completed_at` | DateTimeField | nullable |
| `cancelled_at` | DateTimeField | nullable |
| `cancellation_reason` | TextField | nullable |
| `created_at` | DateTimeField | auto_now_add |
| `updated_at` | DateTimeField | auto_now |

---

## 8. `chats` app → Table: **`chats_bookingmessage`**

### Model: **BookingMessage**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `booking` | **FK → Booking** | CASCADE, related_name='messages' |
| `sender_user` | **FK → User** | SET_NULL, nullable, related_name='sent_messages' |
| `sender_handyman` | **FK → Handyman** | SET_NULL, nullable, related_name='sent_messages' |
| `message` | TextField | blank=True |
| `image` | ImageField | upload_to='chat_images/', nullable |
| `is_read` | BooleanField | default=False |
| `created_at` | DateTimeField | auto_now_add |

---

## 9. `chats` app → Table: **`chats_supportconversation`**

### Model: **SupportConversation**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `user` | **FK → User** | CASCADE, nullable, related_name='support_conversations' |
| `handyman` | **FK → Handyman** | CASCADE, nullable, related_name='support_conversations' |
| `is_active` | BooleanField | default=True |
| `created_at` | DateTimeField | auto_now_add |
| `updated_at` | DateTimeField | auto_now |

---

## 10. `chats` app → Table: **`chats_supportmessage`**

### Model: **SupportMessage**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `conversation` | **FK → SupportConversation** | CASCADE, related_name='messages' |
| `sender_user` | **FK → User** | SET_NULL, nullable |
| `sender_handyman` | **FK → Handyman** | SET_NULL, nullable |
| `is_from_admin` | BooleanField | default=False |
| `message` | TextField | blank=True |
| `image` | ImageField | upload_to='support_images/', nullable |
| `is_read` | BooleanField | default=False |
| `created_at` | DateTimeField | auto_now_add |

---

## 11. `payments` app → Table: **`payments_payment`**

### Model: **Payment**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `booking` | **FK → Booking** | PROTECT, nullable, related_name='payment' |
| `user` | **FK → User** | PROTECT, nullable, related_name='payments' |
| `handyman` | **FK → Handyman** | PROTECT, nullable, related_name='received_payments' |
| `gross_amount` | DecimalField(12,2) | default=0.00 |
| `platform_fee` | DecimalField(12,2) | default=0.00 (30% platform fee) |
| `handyman_amount` | DecimalField(12,2) | default=0.00 (70% handyman payout) |
| `method` | CharField(10) | choices: `'mtn'`, `'orange'`; default=`'mtn'` |
| `payer_number` | CharField(20) | nullable (user's phone number) |
| `handyman_payment_number` | CharField(20) | nullable |
| `collect_ref` | CharField(100) | nullable (MeSomb collection tx ref) |
| `payout_ref` | CharField(100) | nullable (MeSomb payout tx ref) |
| `handyman_withdrawal_status` | CharField(20) | choices: `'pending'`, `'processing'`, `'completed'`, `'failed'`; default=`'pending'` |
| `collect_status` | CharField(30) | nullable |
| `payout_status` | CharField(30) | nullable |
| `admin_withdrawal_requested` | BooleanField | default=False |
| `admin_withdrawal_amount` | DecimalField(12,2) | default=0.00 |
| `admin_withdrawal_number` | CharField(20) | nullable |
| `admin_withdrawal_status` | CharField(20) | default=`'pending'` |
| `status` | CharField(20) | choices: `'pending'`, `'collected'`, `'split'`, `'failed'`, `'refunded'`; default=`'pending'` |
| `error_message` | TextField | nullable |
| `created_at` | DateTimeField | auto_now_add |
| `updated_at` | DateTimeField | auto_now |

---

## 12. `payments` app → Table: **`payments_wallet`**

### Model: **Wallet**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `user` | **OneToOne → User** | CASCADE, nullable, related_name='wallet' |
| `handyman` | **OneToOne → Handyman** | CASCADE, nullable, related_name='wallet' |
| `balance` | DecimalField(12,2) | default=0.00 |
| `total_earned_gross` | DecimalField(12,2) | default=0.00 (handyman only) |
| `total_earned_net` | DecimalField(12,2) | default=0.00 (handyman only) |
| `total_app_commissions` | DecimalField(12,2) | default=0.00 (handyman only) |
| `created_at` | DateTimeField | auto_now_add |
| `updated_at` | DateTimeField | auto_now |

---

## 13. `payments` app → Table: **`payments_transaction`**

### Model: **Transaction**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `wallet` | **FK → Wallet** | CASCADE, related_name='transactions' |
| `payment` | **FK → Payment** | SET_NULL, nullable, related_name='transactions' |
| `amount` | DecimalField(12,2) | |
| `transaction_type` | CharField(10) | choices: `'credit'`, `'debit'` |
| `status` | CharField(10) | choices: `'pending'`, `'success'`, `'failed'`; default=`'pending'` |
| `description` | CharField(255) | |
| `related_user` | **FK → User** | SET_NULL, nullable |
| `related_handyman` | **FK → Handyman** | SET_NULL, nullable |
| `created_at` | DateTimeField | auto_now_add |

---

## 14. `ratings` app → Table: **`ratings_rating`**

### Model: **Rating**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `user` | **FK → User** | CASCADE, related_name='ratings_given' |
| `handyman` | **FK → Handyman** | CASCADE, related_name='ratings_received' |
| `rating` | PositiveSmallIntegerField | validators: Min=1, Max=10 |
| `review` | TextField | nullable |
| `created_at` | DateTimeField | auto_now_add |
| `updated_at` | DateTimeField | auto_now |
| **unique_together** | `(user, handyman)` | One rating per user-handyman pair |

---

## 15. `favorites` app → Table: **`favorites_favorite`**

### Model: **Favorite**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `user` | **FK → User** | CASCADE, related_name='favorites' |
| `handyman` | **FK → Handyman** | CASCADE, related_name='favorited_by' |
| `created_at` | DateTimeField | auto_now_add |
| **unique_together** | `(user, handyman)` | One favorite per user-handyman pair |

---

## 16. `notifications` app → Table: **`notifications_notification`**

### Model: **Notification**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `user` | **FK → User** | CASCADE, nullable, related_name='notifications' |
| `handyman` | **FK → Handyman** | CASCADE, nullable, related_name='handyman_notifications' |
| `title` | CharField(255) | |
| `body` | TextField | |
| `notification_type` | CharField(30) | choices: `'booking_request'`, `'booking_accepted'`, `'booking_declined'`, `'booking_completed'`, `'booking_cancelled'`, `'new_message'`, `'payment_success'` |
| `booking` | **FK → Booking** | SET_NULL, nullable |
| `is_read` | BooleanField | default=False |
| `created_at` | DateTimeField | auto_now_add |

---

## 17. `subscriptions` app → Table: **`subscriptions_subscription`**

### Model: **Subscription**

| Field | Type | Constraints / Notes |
|-------|------|---------------------|
| `id` | AutoField | Primary Key |
| `handyman` | **FK → Handyman** | CASCADE, **unique** |
| `plan` | CharField(255) | |
| `price` | DecimalField(6,2) | |
| `duration` | DurationField | |
| `created_at` | DateTimeField | auto_now_add |
| `updated_at` | DateTimeField | auto_now |