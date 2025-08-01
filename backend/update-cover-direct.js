// 直接使用数据库连接更新封面图片
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 数据库文件路径
const dbPath = path.join(__dirname, 'prisma', 'dev.db');

function updateCoverImages() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('连接数据库失败:', err.message);
        reject(err);
        return;
      }
      console.log('已连接到SQLite数据库');
    });

    // 查询所有有图片但没有封面的活动
    const selectQuery = `
      SELECT id, title, images, coverImage 
      FROM activities 
      WHERE images != '[]' 
      AND images IS NOT NULL 
      AND (coverImage IS NULL OR coverImage = '')
    `;

    db.all(selectQuery, [], (err, rows) => {
      if (err) {
        console.error('查询失败:', err.message);
        reject(err);
        return;
      }

      console.log(`找到 ${rows.length} 个需要更新封面的活动:`);
      
      if (rows.length === 0) {
        console.log('没有需要更新的活动');
        db.close();
        resolve();
        return;
      }

      let updatedCount = 0;
      let processedCount = 0;

      rows.forEach((row) => {
        try {
          const images = JSON.parse(row.images);
          if (images && images.length > 0) {
            const firstImage = images[0];
            
            console.log(`\n更新活动: ${row.title}`);
            console.log(`  - 活动ID: ${row.id}`);
            console.log(`  - 当前封面: ${row.coverImage || '无'}`);
            console.log(`  - 图片数组: ${row.images}`);
            console.log(`  - 设置封面为: ${firstImage}`);

            const updateQuery = `UPDATE activities SET coverImage = ? WHERE id = ?`;
            
            db.run(updateQuery, [firstImage, row.id], function(err) {
              processedCount++;
              
              if (err) {
                console.error(`  ❌ 更新失败: ${err.message}`);
              } else {
                updatedCount++;
                console.log(`  ✅ 更新成功`);
              }

              // 如果所有活动都处理完了
              if (processedCount === rows.length) {
                console.log(`\n更新完成! 共更新了 ${updatedCount} 个活动的封面图片`);
                
                // 验证更新结果
                verifyUpdates(db, () => {
                  db.close((err) => {
                    if (err) {
                      console.error('关闭数据库连接失败:', err.message);
                    } else {
                      console.log('数据库连接已关闭');
                    }
                    resolve();
                  });
                });
              }
            });
          } else {
            processedCount++;
            console.log(`活动 ${row.title} 的图片数组为空，跳过`);
            
            if (processedCount === rows.length) {
              console.log(`\n更新完成! 共更新了 ${updatedCount} 个活动的封面图片`);
              verifyUpdates(db, () => {
                db.close();
                resolve();
              });
            }
          }
        } catch (parseErr) {
          processedCount++;
          console.error(`解析活动 ${row.title} 的图片数组失败:`, parseErr.message);
          
          if (processedCount === rows.length) {
            console.log(`\n更新完成! 共更新了 ${updatedCount} 个活动的封面图片`);
            verifyUpdates(db, () => {
              db.close();
              resolve();
            });
          }
        }
      });
    });
  });
}

function verifyUpdates(db, callback) {
  console.log('\n验证更新结果:');
  
  const verifyQuery = `
    SELECT id, title, images, coverImage 
    FROM activities 
    WHERE images != '[]' 
    AND images IS NOT NULL
  `;

  db.all(verifyQuery, [], (err, rows) => {
    if (err) {
      console.error('验证查询失败:', err.message);
      callback();
      return;
    }

    rows.forEach((row) => {
      try {
        const images = JSON.parse(row.images);
        const isConsistent = row.coverImage === images[0];
        console.log(`活动: ${row.title}`);
        console.log(`  - 封面: ${row.coverImage}`);
        console.log(`  - 第一张图片: ${images[0]}`);
        console.log(`  - 一致性: ${isConsistent ? '✅ 一致' : '❌ 不一致'}`);
      } catch (parseErr) {
        console.log(`活动: ${row.title}`);
        console.log(`  - 解析图片数组失败: ${parseErr.message}`);
      }
    });
    
    callback();
  });
}

// 运行更新
updateCoverImages().catch(console.error);