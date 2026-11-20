from .data import UserRepository


class Module:
    def __init__(self, pool):
        self.repository = UserRepository(pool)
