import dotenv from 'dotenv';
dotenv.config();

async function testATMAPI() {
  try {
    console.log('🔍 اختبار API الماكينات...\n');
    
    // Test local API
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9002';
    const url = `${baseUrl}/api/atms`;
    
    console.log(`📡 جاري الاتصال بـ: ${url}\n`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ خطأ في API: ${response.status} ${response.statusText}`);
      return;
    }
    
    const atms = await response.json();
    console.log(`✅ تم جلب ${atms.length} ماكينة\n`);
    
    if (atms.length === 0) {
      console.log('⚠️  لا توجد ماكينات في قاعدة البيانات');
      return;
    }
    
    // Get unique bank names
    const uniqueBanks = new Set(atms.map((a: any) => a.bankName));
    console.log('🏦 أسماء البنوك الفريدة:');
    Array.from(uniqueBanks).sort().forEach((bank, index) => {
      const count = atms.filter((a: any) => a.bankName === bank).length;
      console.log(`   ${index + 1}. "${bank}" (${count} ماكينة)`);
    });
    
    // Check for "البنك العربي"
    console.log('\n🔎 فحص البنك العربي:');
    const arabBankAtms = atms.filter((a: any) => 
      a.bankName && a.bankName.includes('البنك العربي')
    );
    console.log(`   إجمالي: ${arabBankAtms.length} ماكينة`);
    
    if (arabBankAtms.length > 0) {
      const uniqueNames = new Set(arabBankAtms.map((a: any) => a.bankName));
      console.log('\n   أسماء البنك العربي في قاعدة البيانات:');
      Array.from(uniqueNames).forEach(name => {
        const count = arabBankAtms.filter((a: any) => a.bankName === name).length;
        console.log(`     "${name}": ${count} ماكينة`);
      });
      
      // Check for "القاهرة الجديدة"
      const newCairo = arabBankAtms.filter((a: any) => a.city === 'القاهرة الجديدة');
      console.log(`\n   في مدينة "القاهرة الجديدة": ${newCairo.length} ماكينة`);
      
      if (newCairo.length > 0) {
        console.log('\n   أمثلة:');
        newCairo.slice(0, 5).forEach((atm: any) => {
          console.log(`     - ${atm.atmCode}: "${atm.bankName}" - ${atm.city}`);
        });
      }
    }
    
  } catch (error: any) {
    console.error('❌ خطأ:', error.message);
    console.log('\n💡 تأكد من أن التطبيق يعمل على: npm run dev');
  }
}

testATMAPI();

