const { PrismaClient } = require('./src/generated/prisma');
const express = require('express');
const cors = require('cors');

const prisma = new PrismaClient();
const app = express();
const PORT = 3001;

// 启用CORS
app.use(cors());
app.use(express.json());

// 静态文件服务
app.use(express.static('public'));

// 创建一个简单的HTML页面来查看数据库
const htmlPage = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>数据库查看器</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .activity { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .activity h3 { margin-top: 0; color: #333; }
        .field { margin: 5px 0; }
        .label { font-weight: bold; color: #666; }
        .images { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; }
        .image { width: 100px; height: 100px; object-fit: cover; border-radius: 5px; }
        .refresh-btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
        .refresh-btn:hover { background: #0056b3; }
        .empty-images { color: #999; font-style: italic; }
    </style>
</head>
<body>
    <div class="container">
        <h1>数据库活动查看器</h1>
        <button class="refresh-btn" onclick="loadActivities()">刷新数据</button>
        <div id="activities"></div>
    </div>

    <script>
        async function loadActivities() {
            try {
                const response = await fetch('/api/activities');
                const activities = await response.json();
                displayActivities(activities);
            } catch (error) {
                console.error('加载活动失败:', error);
                document.getElementById('activities').innerHTML = '<p style="color: red;">加载失败: ' + error.message + '</p>';
            }
        }

        function displayActivities(activities) {
            const container = document.getElementById('activities');
            if (activities.length === 0) {
                container.innerHTML = '<p>暂无活动数据</p>';
                return;
            }

            container.innerHTML = activities.map(activity => {
                const images = Array.isArray(activity.images) ? activity.images : 
                              (typeof activity.images === 'string' ? JSON.parse(activity.images || '[]') : []);
                
                // 格式化点赞信息
                const likesInfo = activity.likes?.map(like => 
                    (like.user?.nickname || like.user?.username) + ' (' + like.user?.id + ')'
                ).join(', ') || '无';
                
                // 格式化评论信息
                const commentsInfo = activity.comments?.map(comment => 
                    '<div style="margin: 10px 0; padding: 10px; border: 1px solid #e0e0e0; border-radius: 5px; background-color: #f9f9f9;">' +
                        '<div style="margin-bottom: 8px;"><strong style="color: #2c3e50;">' + (comment.user?.nickname || comment.user?.username) + '</strong></div>' +
                        '<div style="margin-bottom: 8px; color: #34495e;">' + comment.content + '</div>' +
                        '<div style="display: flex; gap: 15px; margin-bottom: 5px;">' +
                            '<small style="color: #7f8c8d;">📅 ' + new Date(comment.createdAt).toLocaleString() + '</small>' +
                            '<small style="color: #e67e22;">⭐ 评分: ' + (comment.rating || '无') + '/5</small>' +
                            '<small style="color: #e74c3c;">👍 点赞: ' + (comment.likes?.length || 0) + '人</small>' +
                        '</div>' +
                        (comment.likes?.length > 0 ? 
                            '<div style="margin-top: 8px; padding: 5px; background-color: #ecf0f1; border-radius: 3px;">' +
                                '<small style="color: #2980b9;">💙 点赞用户: ' + comment.likes.map(like => 
                                    '<span style="background-color: #3498db; color: white; padding: 2px 6px; border-radius: 10px; margin-right: 5px;">' +
                                    (like.user?.nickname || like.user?.username) + '</span>'
                                ).join('') + '</small>' +
                            '</div>' : '') +
                    '</div>'
                ).join('') || '<span class="empty-images">无评论</span>';
                
                // 格式化订单信息
                const ordersInfo = activity.orders?.map(order => 
                    '<div style="margin: 5px 0; padding: 5px; border-left: 3px solid #28a745;">' +
                        '<strong>' + (order.user?.nickname || order.user?.username) + '</strong><br>' +
                        '<small>参与人数: ' + order.participants + '</small><br>' +
                        '<small>状态: ' + order.status + '</small><br>' +
                        '<small>报名时间: ' + new Date(order.createdAt).toLocaleString() + '</small>' +
                        (order.notes ? '<br><small>备注: ' + order.notes + '</small>' : '') +
                    '</div>'
                ).join('') || '<span class="empty-images">无报名</span>';
                
                return \`
                    <div class="activity">
                        <h3>\${activity.title}</h3>
                        <div class="field"><span class="label">ID:</span> \${activity.id}</div>
                        <div class="field"><span class="label">分类:</span> \${activity.category}</div>
                        <div class="field"><span class="label">组织者:</span> \${activity.organizer?.username || '未知'} (\${activity.organizer?.email || ''})</div>
                        <div class="field"><span class="label">状态:</span> \${activity.status}</div>
                        <div class="field"><span class="label">地点:</span> \${activity.location || '未设置'}</div>
                        <div class="field"><span class="label">开始时间:</span> \${activity.startTime ? new Date(activity.startTime).toLocaleString() : '未设置'}</div>
                        <div class="field"><span class="label">结束时间:</span> \${activity.endTime ? new Date(activity.endTime).toLocaleString() : '未设置'}</div>
                        <div class="field"><span class="label">最大参与人数:</span> \${activity.maxParticipants || '无限制'}</div>
                        <div class="field"><span class="label">当前参与人数:</span> \${activity.currentParticipants || 0}</div>
                        <div class="field"><span class="label">价格:</span> ¥\${activity.price || 0}</div>
                        <div class="field"><span class="label">创建时间:</span> \${new Date(activity.createdAt).toLocaleString()}</div>
                        
                        <div class="field"><span class="label">统计信息:</span>
                            点赞数: \${activity._count?.likes || 0} | 
                            评论数: \${activity._count?.comments || 0} | 
                            报名数: \${activity._count?.orders || 0}
                        </div>
                        
                        <div class="field"><span class="label">描述:</span> \${activity.description || '无描述'}</div>
                        
                        <div class="field"><span class="label">点赞用户 (\${activity._count?.likes || 0}人):</span><br>
                            \${likesInfo}
                        </div>
                        
                        <div class="field"><span class="label">评论列表 (\${activity._count?.comments || 0}条):</span><br>
                            \${commentsInfo}
                        </div>
                        
                        <div class="field"><span class="label">报名列表 (\${activity._count?.orders || 0}人):</span><br>
                            \${ordersInfo}
                        </div>
                        
                        <div class="field"><span class="label">封面图片:</span> \${activity.coverImage || '<span class="empty-images">无</span>'}</div>
                        <div class="field">
                            <span class="label">图片数组 (\${images.length}张):</span>
                            \${images.length > 0 ? 
                                \`<div class="images">\${images.map(img => \`<img src="\${img}" class="image" alt="活动图片" onerror="this.style.display='none'">\`).join('')}</div>\` :
                                '<span class="empty-images">无图片</span>'
                            }
                        </div>
                        
                        <div class="field"><span class="label">标签:</span> \${activity.tags ? JSON.stringify(activity.tags) : '无标签'}</div>
                        <div class="field"><span class="label">要求:</span> \${activity.requirements || '无特殊要求'}</div>
                        <div class="field"><span class="label">联系信息:</span> \${activity.contactInfo || '无'}</div>
                        <div class="field"><span class="label">是否推荐:</span> \${activity.isRecommended ? '是' : '否'}</div>
                        <div class="field"><span class="label">浏览次数:</span> \${activity.viewCount || 0}</div>
                        <div class="field"><span class="label">分享次数:</span> \${activity.shareCount || 0}</div>
                    </div>
                \`;
            }).join('');
        }

        // 页面加载时自动加载数据
        loadActivities();
    </script>
</body>
</html>
`;

// 主页面
app.get('/', (req, res) => {
    res.send(htmlPage);
});

// API接口：获取所有活动及其子元素
app.get('/api/activities', async (req, res) => {
    try {
        const activities = await prisma.activity.findMany({
            include: {
                organizer: {
                    select: {
                        id: true,
                        username: true,
                        nickname: true,
                        email: true
                    }
                },
                likes: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                nickname: true
                            }
                        }
                    }
                },
                comments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                nickname: true
                            }
                        },
                        likes: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        username: true,
                                        nickname: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                orders: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                nickname: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        likes: true,
                        comments: true,
                        orders: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        res.json(activities);
    } catch (error) {
        console.error('查询活动失败:', error);
        res.status(500).json({ error: '查询失败', details: error.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`\n🔍 数据库查看器已启动!`);
    console.log(`📊 访问地址: http://localhost:${PORT}`);
    console.log(`🔄 点击页面上的"刷新数据"按钮查看最新数据\n`);
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n正在关闭数据库查看器...');
    await prisma.$disconnect();
    process.exit(0);
});