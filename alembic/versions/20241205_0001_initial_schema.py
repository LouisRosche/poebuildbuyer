"""Initial database schema

Revision ID: 0001
Revises:
Create Date: 2024-12-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # === BUILDS ===
    op.create_table(
        'builds',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('class_name', sa.String(100), nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        'build_items',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('build_id', sa.String(36), sa.ForeignKey('builds.id', ondelete='CASCADE'), nullable=False),
        sa.Column('slot', sa.String(50), nullable=False),
        sa.Column('item_name', sa.String(255), nullable=False),
        sa.Column('item_type', sa.String(255), nullable=True),
        sa.Column('is_unique', sa.Boolean, default=True),
        sa.Column('required', sa.Boolean, default=True),
        sa.Column('priority', sa.Integer, default=1),
        sa.Column('variant', sa.String(100), nullable=True),
        sa.Column('min_stats', sa.JSON, nullable=True),
    )
    op.create_index('ix_build_items_build_id', 'build_items', ['build_id'])

    # === PRICES ===
    op.create_table(
        'price_snapshots',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('item_name', sa.String(255), nullable=False),
        sa.Column('item_type', sa.String(100), nullable=True),
        sa.Column('league', sa.String(100), nullable=False),
        sa.Column('min_price', sa.Float, nullable=False),
        sa.Column('median_price', sa.Float, nullable=False),
        sa.Column('mean_price', sa.Float, nullable=False),
        sa.Column('max_price', sa.Float, nullable=False),
        sa.Column('currency', sa.String(50), default='chaos'),
        sa.Column('chaos_equivalent', sa.Float, nullable=False),
        sa.Column('listings_count', sa.Integer, default=0),
        sa.Column('timestamp', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('ix_price_snapshots_item_name', 'price_snapshots', ['item_name'])
    op.create_index('ix_price_snapshots_league', 'price_snapshots', ['league'])
    op.create_index('ix_price_snapshots_timestamp', 'price_snapshots', ['timestamp'])

    op.create_table(
        'currency_rates',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('currency', sa.String(50), nullable=False),
        sa.Column('chaos_equivalent', sa.Float, nullable=False),
        sa.Column('league', sa.String(100), nullable=False),
        sa.Column('timestamp', sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index('ix_currency_rates_currency', 'currency_rates', ['currency'])
    op.create_index('ix_currency_rates_league', 'currency_rates', ['league'])

    # === INTERVIEW/RECOMMENDATIONS ===
    op.create_table(
        'build_archetypes',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False, unique=True),
        sa.Column('class_name', sa.String(100), nullable=False),
        sa.Column('base_class', sa.String(50), nullable=True),
        sa.Column('primary_playstyle', sa.String(50), nullable=False),
        sa.Column('damage_type', sa.String(50), nullable=True),
        sa.Column('tags', sa.JSON, default=[]),
        sa.Column('mapping_score', sa.Integer, default=5),
        sa.Column('bossing_score', sa.Integer, default=5),
        sa.Column('league_start_score', sa.Integer, default=5),
        sa.Column('complexity', sa.Integer, default=5),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('pros', sa.JSON, default=[]),
        sa.Column('cons', sa.JSON, default=[]),
        sa.Column('playstyle_notes', sa.Text, nullable=True),
        sa.Column('leveling_notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_build_archetypes_slug', 'build_archetypes', ['slug'])
    op.create_index('ix_build_archetypes_class_name', 'build_archetypes', ['class_name'])

    op.create_table(
        'budget_tiers',
        sa.Column('id', sa.String(50), primary_key=True),
        sa.Column('archetype_id', sa.String(50), sa.ForeignKey('build_archetypes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tier_order', sa.Integer, nullable=False),
        sa.Column('tier_name', sa.String(100), nullable=False),
        sa.Column('min_budget', sa.Integer, default=0),
        sa.Column('max_budget', sa.Integer, nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('items', sa.JSON, default=[]),
    )
    op.create_index('ix_budget_tiers_archetype_id', 'budget_tiers', ['archetype_id'])

    op.create_table(
        'interview_sessions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('responses', sa.JSON, default={}),
        sa.Column('recommendations', sa.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime, server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime, nullable=True),
    )


def downgrade() -> None:
    op.drop_table('interview_sessions')
    op.drop_table('budget_tiers')
    op.drop_table('build_archetypes')
    op.drop_table('currency_rates')
    op.drop_table('price_snapshots')
    op.drop_table('build_items')
    op.drop_table('builds')
