const { PrismaClient } = require('./src/generated/prisma');
const express = require('express');
const cors = require('cors');

const prisma = new PrismaClient();
const app = express();
const PORT = 3002;

// 启用CORS
app.use(cors());
app.use(express.json());

// 创建一个简单的HTML页面来查看用户数据
const htmlPage = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>用户数据查看器</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .user { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; background-color: white; }
        .user h3 { margin-top: 0; color: #333; }
        .field { margin: 5px 0; }
        .label { font-weight: bold; color: #666; }
        .password { background-color: #ffe6e6; padding: 5px; border-radius: 3px; font-family: monospace; }
        .refresh-btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-bottom: 20px; }
        .refresh-btn:hover { background: #0056b3; }
        .search-box { margin-bottom: 20px; }
        .search-box input { padding: 10px; width: 300px; border: 1px solid #ddd; border-radius: 5px; }
        .highlight { background-color: yellow; }
    </style>
</head>
<body>
    <div class="container">
        <h1>用户数据查看器</h1>
        <button class="refresh-btn" onclick="loadUsers()">刷新数据</button>
        
        <div class="search-box">
            <input type="text" id="searchInput" placeholder="搜索用户名或邮箱..." onkeyup="filterUsers()">
        </div>
        
        <div id="users"></div>
    </div>

    <script>
        let allUsers = [];
        
        async function loadUsers() {
            try {
                const response = await fetch('/api/users');
                const users = await response.json();
                allUsers = users;
                displayUsers(users);
            } catch (error) {
                console.error('加载用户失败:', error);
                document.getElementById('users').innerHTML = '<p style="color: red;">加载失败: ' + error.message + '</p>';
            }
        }
        
        function filterUsers() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const filteredUsers = allUsers.filter(user => 
                user.username.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                (user.nickname && user.nickname.toLowerCase().includes(searchTerm))
            );
            displayUsers(filteredUsers);
        }

        function displayUsers(users) {
            const container = document.getElementById('users');
            if (users.length === 0) {
                container.innerHTML = '<p>暂无用户数据</p>';
                return;
            }

            container.innerHTML = users.map(user => {
                // 格式化活动信息
                const activitiesInfo = user.activities?.map(activity => 
                    '<div style="margin: 5px 0; padding: 5px; border-left: 3px solid #007bff;">' +
                        '<strong>' + activity.title + '</strong><br>' +
                        '<small>状态: ' + activity.status + '</small><br>' +
                        '<small>创建时间: ' + new Date(activity.createdAt).toLocaleString() + '</small>' +
                    '</div>'
                ).join('') || '<span style="color: #999;">无创建的活动</span>';
                
                // 格式化点赞信息
                const likesInfo = user.activityLikes?.map(like => 
                    '<div style="margin: 5px 0; padding: 5px; border-left: 3px solid #28a745;">' +
                        '<strong>' + like.activity.title + '</strong><br>' +
                        '<small>点赞时间: ' + new Date(like.createdAt).toLocaleString() + '</small>' +
                    '</div>'
                ).join('') || '<span style="color: #999;">无点赞记录</span>';
                
                // 格式化评论信息
                const commentsInfo = user.comments?.map(comment => 
                    '<div style="margin: 5px 0; padding: 5px; border-left: 3px solid #ffc107;">' +
                        '<strong>活动: ' + comment.activity.title + '</strong><br>' +
                        '<div>' + comment.content + '</div>' +
                        '<small>评分: ' + (comment.rating || '无') + '/5</small><br>' +
                        '<small>评论时间: ' + new Date(comment.createdAt).toLocaleString() + '</small>' +
                    '</div>'
                ).join('') || '<span style="color: #999;">无评论记录</span>';
                
                // 格式化订单信息
                const ordersInfo = user.orders?.map(order => 
                    '<div style="margin: 5px 0; padding: 5px; border-left: 3px solid #dc3545;">' +
                        '<strong>活动: ' + order.activity.title + '</strong><br>' +
                        '<small>参与人数: ' + order.participants + '</small><br>' +
                        '<small>状态: ' + order.status + '</small><br>' +
                        '<small>报名时间: ' + new Date(order.createdAt).toLocaleString() + '</small>' +
                        (order.notes ? '<br><small>备注: ' + order.notes + '</small>' : '') +
                    '</div>'
                ).join('') || '<span style="color: #999;">无报名记录</span>';
                
                return '<div class="user">' +
                    '<h3>' + user.username + (user.nickname ? ' (' + user.nickname + ')' : '') + '</h3>' +
                    '<div class="field"><span class="label">ID:</span> ' + user.id + '</div>' +
                    '<div class="field"><span class="label">用户名:</span> ' + user.username + '</div>' +
                    '<div class="field"><span class="label">昵称:</span> ' + (user.nickname || '未设置') + '</div>' +
                    '<div class="field"><span class="label">邮箱:</span> ' + user.email + '</div>' +
                    '<div class="field"><span class="label">密码:</span> <span class="password">' + user.password + '</span></div>' +
                    '<div class="field"><span class="label">角色:</span> ' + user.role + '</div>' +
                    '<div class="field"><span class="label">状态:</span> ' + user.status + '</div>' +
                    '<div class="field"><span class="label">头像:</span> ' + (user.avatar || '未设置') + '</div>' +
                    '<div class="field"><span class="label">个人简介:</span> ' + (user.bio || '未设置') + '</div>' +
                    '<div class="field"><span class="label">电话:</span> ' + (user.phone || '未设置') + '</div>' +
                    '<div class="field"><span class="label">地址:</span> ' + (user.address || '未设置') + '</div>' +
                    '<div class="field"><span class="label">生日:</span> ' + (user.birthday ? new Date(user.birthday).toLocaleDateString() : '未设置') + '</div>' +
                    '<div class="field"><span class="label">性别:</span> ' + (user.gender || '未设置') + '</div>' +
                    '<div class="field"><span class="label">注册时间:</span> ' + new Date(user.createdAt).toLocaleString() + '</div>' +
                    '<div class="field"><span class="label">最后更新:</span> ' + new Date(user.updatedAt).toLocaleString() + '</div>' +
                    '<div class="field"><span class="label">统计信息:</span> 创建活动: ' + (user._count?.activities || 0) + ' | 点赞数: ' + (user._count?.activityLikes || 0) + ' | 评论数: ' + (user._count?.comments || 0) + ' | 报名数: ' + (user._count?.orders || 0) + '</div>' +
                    '<div class="field"><span class="label">创建的活动 (' + (user._count?.activities || 0) + '个):</span><br>' + activitiesInfo + '</div>' +
                    '<div class="field"><span class="label">点赞记录 (' + (user._count?.activityLikes || 0) + '条):</span><br>' + likesInfo + '</div>' +
                    '<div class="field"><span class="label">评论记录 (' + (user._count?.comments || 0) + '条):</span><br>' + commentsInfo + '</div>' +
                    '<div class="field"><span class="label">报名记录 (' + (user._count?.orders || 0) + '条):</span><br>' + ordersInfo + '</div>' +
                '</div>';
            }).join('');
        }

        // 页面加载时自动加载数据
        loadUsers();
    </script>
</body>
</html>
`;

// 主页面
app.get('/', (req, res) => {
    res.send(htmlPage);
});

// API接口：获取所有用户及其相关数据
app.get('/api/users', async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                activities: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        createdAt: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                activityLikes: {
                    include: {
                        activity: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                comments: {
                    include: {
                        activity: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                orders: {
                    include: {
                        activity: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                _count: {
                    select: {
                        activities: true,
                        activityLikes: true,
                        comments: true,
                        orders: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        
        res.json(users);
    } catch (error) {
        console.error('查询用户失败:', error);
        res.status(500).json({ error: '查询失败', details: error.message });
    }
});

// API接口：根据用户名搜索特定用户
app.get('/api/users/search/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await prisma.user.findFirst({
            where: {
                username: {
                    contains: username,
                    mode: 'insensitive'
                }
            },
            include: {
                activities: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        createdAt: true
                    }
                },
                activityLikes: {
                    include: {
                        activity: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                },
                comments: {
                    include: {
                        activity: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                },
                orders: {
                    include: {
                        activity: {
                            select: {
                                id: true,
                                title: true
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        activities: true,
                        activityLikes: true,
                        comments: true,
                        orders: true
                    }
                }
            }
        });
        
        if (!user) {
            return res.status(404).json({ error: '用户未找到' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('搜索用户失败:', error);
        res.status(500).json({ error: '搜索失败', details: error.message });
    }
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`\n👥 用户数据查看器已启动!`);
    console.log(`📊 访问地址: http://localhost:${PORT}`);
    console.log(`🔍 可以查看所有用户信息包括密码`);
    console.log(`🔄 点击页面上的"刷新数据"按钮查看最新数据\n`);
});

// 优雅关闭
process.on('SIGINT', async () => {
    console.log('\n正在关闭用户数据查看器...');
    await prisma.$disconnect();
    process.exit(0);
});