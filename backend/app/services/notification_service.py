import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

logger = logging.getLogger("notification_service")
logger.setLevel(logging.INFO)

class NotificationService:
    def __init__(self):
        # Audit log of sent notifications for verification and testing
        self.outbox_log: List[Dict[str, Any]] = []

    def send_sms(self, phone_number: str, message: str, priority: str = "NORMAL") -> Dict[str, Any]:
        """
        Dispatches SMS via gateway (e.g. MSG91, Twilio or Dev Mock).
        Critical for rural areas where data connectivity is unavailable or intermittent.
        """
        record = {
            "channel": "SMS",
            "recipient": phone_number,
            "message": message,
            "priority": priority,
            "status": "DELIVERED",
            "dispatched_at": datetime.now(timezone.utc).isoformat()
        }
        self.outbox_log.append(record)
        logger.info(f"[SMS -> {phone_number}] ({priority}): {message}")
        return record

    def send_push(self, user_id: str, title: str, body: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Dispatches Firebase Cloud Messaging (FCM) push notification to mobile app.
        """
        record = {
            "channel": "PUSH",
            "recipient_user_id": user_id,
            "title": title,
            "body": body,
            "data": data or {},
            "status": "SENT",
            "dispatched_at": datetime.now(timezone.utc).isoformat()
        }
        self.outbox_log.append(record)
        logger.info(f"[PUSH -> {user_id}]: {title} - {body}")
        return record

    def notify_vet_of_urgent_case(self, vet_phone: str, case_id: str, disease_name: str, urgency: str, village: str):
        message = (
            f"[NDLM ALERT - {urgency}] Suspected {disease_name} reported in {village}. "
            f"Case ID: {case_id[:8]}. Open portal or reply ACK to triage."
        )
        return self.send_sms(vet_phone, message, priority="HIGH" if urgency in ["HIGH", "CRITICAL"] else "NORMAL")

    def notify_farmer_of_vet_action(self, farmer_phone: str, action: str, advice: str):
        message = (
            f"[NDLM VET UPDATE] Your case has been {action}. "
            f"Vet Advice: {advice[:120]}. Check app for full details."
        )
        return self.send_sms(farmer_phone, message, priority="NORMAL")

notification_service = NotificationService()
