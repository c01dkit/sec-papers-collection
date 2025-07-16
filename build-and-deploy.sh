#!/bin/bash

# 构建前清理
echo "🧹 清理旧的构建文件..."
rm -rf dist

# 构建项目
echo "🔨 开始构建项目..."
npm run build

# 检查构建是否成功
if [ $? -eq 0 ]; then
    echo "✅ 构建成功完成"
    
    # 检查关键文件是否存在
    if [ -f "dist/index.html" ]; then
        echo "✅ index.html 存在"
    else
        echo "❌ index.html 缺失"
        exit 1
    fi
    
    # 检查 assets 目录
    if [ -d "dist/assets" ]; then
        echo "✅ assets 目录存在"
        echo "📁 assets 内容:"
        ls -la dist/assets/ | head -10
    else
        echo "❌ assets 目录缺失"
        exit 1
    fi
    
    # 部署到 GitHub Pages
    echo "🚀 开始部署到 GitHub Pages..."
    npm run deploy
    
    if [ $? -eq 0 ]; then
        echo "✅ 部署完成"
    else
        echo "❌ 部署失败"
        exit 1
    fi
else
    echo "❌ 构建失败"
    exit 1
fi
