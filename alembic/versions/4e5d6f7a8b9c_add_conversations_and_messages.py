"""add conversations and messages

Revision ID: 4e5d6f7a8b9c
Revises: 3d6d41734158
Create Date: 2026-04-29 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '4e5d6f7a8b9c'
down_revision: Union[str, Sequence[str], None] = '3d6d41734158'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Create conversations table
    op.create_table('conversations',
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

    # Create messages table
    op.create_table('messages',
    sa.Column('role', sa.String(length=50), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('conversation_id', sa.UUID(), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

    # Add conversation_id to documents
    op.add_column('documents', sa.Column('conversation_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_document_conversation', 'documents', 'conversations', ['conversation_id'], ['id'], ondelete='SET NULL')

def downgrade() -> None:
    op.drop_constraint('fk_document_conversation', 'documents', type_='foreignkey')
    op.drop_column('documents', 'conversation_id')
    op.drop_table('messages')
    op.drop_table('conversations')
