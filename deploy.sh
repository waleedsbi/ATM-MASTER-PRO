#!/bin/bash

# سكريبت نشر تلقائي للنظام
# استخدام: ./deploy.sh

set -e  # إيقاف عند أي خطأ

echo "🚀 بدء عملية النشر..."

# الألوان للرسائل
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# التحقق من وجود .env.production
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ ملف .env.production غير موجود!${NC}"
    echo "يرجى إنشاء ملف .env.production أولاً"
    exit 1
fi

echo -e "${GREEN}✓ ملف .env.production موجود${NC}"

# تثبيت المتطلبات
echo -e "${YELLOW}📦 تثبيت المتطلبات...${NC}"
npm install --production

# توليد Prisma Client
echo -e "${YELLOW}🔧 توليد Prisma Client...${NC}"
npx prisma generate

# دفع Schema إلى قاعدة البيانات
echo -e "${YELLOW}🗄️  تحديث قاعدة البيانات...${NC}"
npx prisma db push --accept-data-loss || echo -e "${YELLOW}⚠️  تحذير: قد تكون هناك تغييرات في قاعدة البيانات${NC}"

# بناء المشروع
echo -e "${YELLOW}🏗️  بناء المشروع...${NC}"
npm run build

echo -e "${GREEN}✅ اكتمل البناء بنجاح!${NC}"
echo ""
echo -e "${GREEN}📝 الخطوات التالية:${NC}"
echo "1. تأكد من أن متغيرات البيئة صحيحة في .env.production"
echo "2. شغّل الخادم باستخدام أحد الطرق التالية:"
echo "   - PM2: pm2 start npm --name 'atm-master-pro' -- start"
echo "   - systemd: sudo systemctl start atm-master-pro"
echo "   - مباشر: npm start"
echo ""
echo -e "${GREEN}🎉 جاهز للنشر!${NC}"

