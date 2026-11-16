from dataclasses import dataclass

from app.core.config import Config
from app.modules.shared.services import RedisKeyGenerator
from app.modules.shared.services.email import EmailService


@dataclass
class Services:
    email_service: EmailService
    redis_key_generator: RedisKeyGenerator


def setup_services(config: Config) -> Services:
    email_service = EmailService(config.smtp)
    redis_key_generator = RedisKeyGenerator(config.redis)

    return Services(email_service, redis_key_generator)
