"""
积分商城服务层 - 处理积分商城相关的业务逻辑
"""
import uuid
import random
import string
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_
from sqlalchemy.orm import joinedload
import logging

from app.models.scoring import PointPurchase, PurchaseStatus, PointTransaction
from app.models.user import User
from app.services.point_service import PointService
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class MallService:
    """积分商城服务类"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.point_service = PointService(db)
        self.notification_service = NotificationService(db)
    
    async def get_mall_items(self) -> List[Dict[str, Any]]:
        """获取商城商品列表"""
        # 这里可以从数据库或配置文件中获取商品信息
        # 暂时返回静态数据
        return [
            {
                "id": "gift_card_50",
                "name": "50元礼品卡",
                "description": "可在指定商店使用的50元礼品卡",
                "pointsCost": 45,
                "category": "gift_card",
                "image": "/images/gift-card-50.png",
                "stock": 100,
                "isAvailable": True,
                "tags": ["热门", "礼品卡"]
            },
            {
                "id": "gift_card_100",
                "name": "100元礼品卡",
                "description": "可在指定商店使用的100元礼品卡",
                "pointsCost": 50,
                "category": "gift_card",
                "image": "/images/gift-card-100.png",
                "stock": 50,
                "isAvailable": True,
                "tags": ["推荐", "礼品卡"]
            },
            {
                "id": "coffee_voucher",
                "name": "咖啡券",
                "description": "星巴克中杯咖啡券一张",
                "pointsCost": 25,
                "category": "food",
                "image": "/images/coffee-voucher.png",
                "stock": 200,
                "isAvailable": True,
                "tags": ["饮品", "日常"]
            },
            {
                "id": "tech_book",
                "name": "技术书籍",
                "description": "精选技术书籍，随机发放",
                "pointsCost": 35,
                "category": "book",
                "image": "/images/tech-book.png",
                "stock": 30,
                "isAvailable": True,
                "tags": ["学习", "书籍"]
            },
            {
                "id": "wireless_mouse",
                "name": "无线鼠标",
                "description": "高品质无线鼠标，办公必备",
                "pointsCost": 40,
                "category": "electronics",
                "image": "/images/wireless-mouse.png",
                "stock": 20,
                "isAvailable": True,
                "tags": ["办公", "电子产品"]
            },
            {
                "id": "team_lunch",
                "name": "团队聚餐券",
                "description": "团队聚餐活动券，可用于团建",
                "pointsCost": 50,
                "category": "activity",
                "image": "/images/team-lunch.png",
                "stock": 10,
                "isAvailable": True,
                "tags": ["团建", "聚餐", "限量"]
            }
        ]
    
    async def get_item_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        """根据ID获取商品信息"""
        items = await self.get_mall_items()
        return next((item for item in items if item["id"] == item_id), None)

    def generate_redemption_code(self, item_name: str) -> str:
        """生成兑换码"""
        # 生成8位随机字符串
        random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
        # 添加时间戳后4位
        timestamp_part = str(int(datetime.now().timestamp()))[-4:]
        # 组合兑换码
        redemption_code = f"RD{random_part}{timestamp_part}"
        return redemption_code
    
    async def can_purchase_item(self, user_id: int, item_id: str) -> Tuple[bool, str]:
        """检查用户是否可以购买商品"""
        # 获取商品信息
        item = await self.get_item_by_id(item_id)
        if not item:
            return False, "商品不存在"
        
        if not item["isAvailable"]:
            return False, "商品暂不可用"
        
        if item["stock"] <= 0:
            return False, "商品库存不足"
        
        # 检查用户积分余额（使用后端存储格式进行比较）
        from app.services.point_service import PointConverter

        user_balance_storage = await self.point_service.get_user_balance(user_id)
        item_cost_storage = PointConverter.to_storage(item["pointsCost"])

        if user_balance_storage < item_cost_storage:
            user_balance_display = PointConverter.to_display(user_balance_storage)
            return False, f"积分余额不足，需要 {item['pointsCost']} 积分，当前余额 {user_balance_display}"
        
        return True, "可以购买"
    
    async def purchase_item(
        self,
        user_id: int,
        item_id: str,
        delivery_info: Optional[Dict[str, Any]] = None
    ) -> PointPurchase:
        """购买商品"""
        # 检查是否可以购买
        can_purchase, message = await self.can_purchase_item(user_id, item_id)
        if not can_purchase:
            raise ValueError(message)
        
        # 获取商品信息
        item = await self.get_item_by_id(item_id)

        # 生成兑换码
        redemption_code = self.generate_redemption_code(item["name"])

        # 使用积分服务创建购买记录
        purchase = await self.point_service.create_purchase_record(
            user_id=user_id,
            item_id=item_id,
            item_name=item["name"],
            item_description=item["description"],
            points_cost=item["pointsCost"],
            delivery_info=delivery_info,
            redemption_code=redemption_code
        )

        # 发送兑换成功通知
        await self.notification_service.create_redemption_notification(
            user_id=user_id,
            item_name=item["name"],
            redemption_code=redemption_code,
            points_cost=item["pointsCost"]
        )

        logger.info(f"用户 {user_id} 购买商品 {item_id}，消费 {item['pointsCost']} 积分，兑换码: {redemption_code}")
        return purchase
    
    async def get_user_purchases(
        self,
        user_id: int,
        status: Optional[PurchaseStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[PointPurchase]:
        """获取用户购买记录"""
        query = select(PointPurchase).options(
            joinedload(PointPurchase.transaction)
        ).filter(PointPurchase.user_id == user_id)
        
        if status:
            query = query.filter(PointPurchase.status == status)
        
        query = query.order_by(desc(PointPurchase.created_at)).limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def get_all_purchases(
        self,
        status: Optional[PurchaseStatus] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[PointPurchase]:
        """获取所有购买记录（管理员用）"""
        query = select(PointPurchase).options(
            joinedload(PointPurchase.user),
            joinedload(PointPurchase.transaction)
        )
        
        if status:
            query = query.filter(PointPurchase.status == status)
        
        query = query.order_by(desc(PointPurchase.created_at)).limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def complete_purchase(
        self,
        purchase_id: str,
        delivery_info: Optional[Dict[str, Any]] = None
    ) -> PointPurchase:
        """完成购买（发货）"""
        result = await self.db.execute(
            select(PointPurchase).filter(PointPurchase.id == purchase_id)
        )
        purchase = result.scalar()
        
        if not purchase:
            raise ValueError("购买记录不存在")
        
        if purchase.status != PurchaseStatus.PENDING:
            raise ValueError("购买记录状态不正确")
        
        purchase.complete(delivery_info)
        await self.db.commit()
        await self.db.refresh(purchase)
        
        logger.info(f"购买记录 {purchase_id} 已完成发货")
        return purchase
    
    async def cancel_purchase(
        self,
        purchase_id: str,
        reason: str = "用户取消"
    ) -> PointPurchase:
        """取消购买并退还积分"""
        result = await self.db.execute(
            select(PointPurchase)
            .options(joinedload(PointPurchase.transaction))
            .filter(PointPurchase.id == purchase_id)
        )
        purchase = result.scalar()
        
        if not purchase:
            raise ValueError("购买记录不存在")
        
        if purchase.status != PurchaseStatus.PENDING:
            raise ValueError("只能取消待处理的购买记录")
        
        # 退还积分
        await self.point_service.earn_points(
            user_id=purchase.user_id,
            amount=purchase.points_cost,
            reference_id=purchase_id,
            reference_type='purchase_refund',
            description=f"购买取消退款: {purchase.item_name}",
            dispute_deadline_days=0  # 退款不支持异议
        )
        
        # 更新购买状态
        purchase.cancel(reason)
        await self.db.commit()
        await self.db.refresh(purchase)
        
        logger.info(f"购买记录 {purchase_id} 已取消，退还 {purchase.points_cost} 积分")
        return purchase
    
    async def get_mall_statistics(self) -> Dict[str, Any]:
        """获取商城统计信息"""
        # 总购买数
        total_result = await self.db.execute(
            select(func.count(PointPurchase.id))
        )
        total_purchases = total_result.scalar() or 0
        
        # 按状态统计
        status_result = await self.db.execute(
            select(
                PointPurchase.status,
                func.count(PointPurchase.id)
            ).group_by(PointPurchase.status)
        )
        status_stats = {status.value: count for status, count in status_result.fetchall()}
        
        # 总积分消费
        total_points_result = await self.db.execute(
            select(func.sum(PointPurchase.points_cost))
            .filter(PointPurchase.status != PurchaseStatus.CANCELLED)
        )
        total_points_spent = total_points_result.scalar() or 0
        
        # 最受欢迎的商品
        popular_items_result = await self.db.execute(
            select(
                PointPurchase.item_id,
                PointPurchase.item_name,
                func.count(PointPurchase.id).label('purchase_count')
            )
            .filter(PointPurchase.status != PurchaseStatus.CANCELLED)
            .group_by(PointPurchase.item_id, PointPurchase.item_name)
            .order_by(desc('purchase_count'))
            .limit(5)
        )
        popular_items = [
            {
                "itemId": item_id,
                "itemName": item_name,
                "purchaseCount": count
            }
            for item_id, item_name, count in popular_items_result.fetchall()
        ]
        
        # 最近30天的购买数
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_result = await self.db.execute(
            select(func.count(PointPurchase.id))
            .filter(PointPurchase.created_at >= thirty_days_ago)
        )
        recent_purchases = recent_result.scalar() or 0
        
        return {
            "totalPurchases": total_purchases,
            "statusDistribution": {
                "pending": status_stats.get("PENDING", 0),
                "completed": status_stats.get("COMPLETED", 0),
                "cancelled": status_stats.get("CANCELLED", 0)
            },
            "totalPointsSpent": int(total_points_spent),
            "popularItems": popular_items,
            "recentPurchases": recent_purchases
        }

    async def get_user_mall_summary(self, user_id: int) -> Dict[str, Any]:
        """获取用户商城使用摘要"""
        # 用户积分余额
        balance = await self.point_service.get_user_balance(user_id)

        # 用户购买统计
        purchase_stats_result = await self.db.execute(
            select(
                func.count(PointPurchase.id).label('total_purchases'),
                func.sum(PointPurchase.points_cost).label('total_spent')
            )
            .filter(
                PointPurchase.user_id == user_id,
                PointPurchase.status != PurchaseStatus.CANCELLED
            )
        )
        stats = purchase_stats_result.first()

        # 最近购买
        recent_purchases_result = await self.db.execute(
            select(PointPurchase)
            .filter(PointPurchase.user_id == user_id)
            .order_by(desc(PointPurchase.created_at))
            .limit(3)
        )
        recent_purchases = recent_purchases_result.scalars().all()

        return {
            "currentBalance": balance,
            "totalPurchases": stats.total_purchases or 0,
            "totalPointsSpent": int(stats.total_spent or 0),
            "recentPurchases": [purchase.to_dict() for purchase in recent_purchases]
        }
