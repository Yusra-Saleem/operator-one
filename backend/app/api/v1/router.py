from fastapi import APIRouter
from app.api.v1.business_ops_router import router as ops_router
from app.api.v1.sales_router import router as sales_router
from app.api.v1.inventory_router import router as inventory_router
from app.api.v1.workflows_router import router as workflows_router
from app.api.v1.integrations_router import router as integrations_router
from app.api.v1.decision_router import router as decision_router
from app.api.v1.dispatch_router import router as dispatch_router
from app.voice.router import router as voice_router

router = APIRouter()
router.include_router(ops_router)
router.include_router(sales_router)
router.include_router(inventory_router)
router.include_router(workflows_router)
router.include_router(integrations_router)
router.include_router(decision_router)
router.include_router(dispatch_router)
router.include_router(voice_router)
