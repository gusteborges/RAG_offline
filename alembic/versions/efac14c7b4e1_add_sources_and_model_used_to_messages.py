"""add sources and model_used to messages

Revision ID: efac14c7b4e1
Revises: 4e5d6f7a8b9c
Create Date: 2026-04-29 12:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'efac14c7b4e1'
down_revision: Union[str, Sequence[str], None] = '4e5d6f7a8b9c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add missing columns to messages table
    op.add_column('messages', sa.Column('sources', sa.JSON(), nullable=True))
    op.add_column('messages', sa.Column('model_used', sa.String(length=100), nullable=True))

def downgrade() -> None:
    op.drop_column('messages', 'model_used')
    op.drop_column('messages', 'sources')
