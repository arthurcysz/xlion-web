#!/usr/bin/env bash
# X-LION 官网一键部署到 Railway。
# 用法： ./deploy.sh
# 前提： 已安装 railway CLI 且已登录（railway login），项目已 link（railway link）。
set -euo pipefail

URL="https://xlion-site-production.up.railway.app"
SERVICE="xlion-site"
PAGES=("/" "/about" "/products" "/contact" "/v40" "/global")

cd "$(dirname "$0")"

echo "▶ 检查 Railway 登录状态..."
railway whoami >/dev/null || { echo "✗ 未登录，请先运行： railway login"; exit 1; }

echo "▶ 上传并部署当前目录..."
railway up --detach --service "$SERVICE"

echo "▶ 等待线上生效（轮询 ${URL} ）..."
ok=0
for i in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 "$URL/" || echo 000)
  printf "  第 %2d 次: / → %s\n" "$i" "$code"
  if [ "$code" = "200" ]; then ok=1; break; fi
  sleep 5
done
[ "$ok" = "1" ] || { echo "✗ 超时：线上未返回 200，请查看 Railway 构建日志（railway logs）"; exit 1; }

echo "▶ 验证关键页面..."
fail=0
for p in "${PAGES[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL$p" || echo 000)
  printf "  %-12s → %s\n" "$p" "$code"
  [ "$code" = "200" ] || fail=1
done

echo "▶ 验证敏感文件已屏蔽（应为 404）..."
for p in "/CLAUDE.md" "/server.js"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL$p" || echo 000)
  printf "  %-12s → %s\n" "$p" "$code"
  [ "$code" = "404" ] || fail=1
done

if [ "$fail" = "0" ]; then
  echo "✅ 部署成功并验证通过： $URL"
else
  echo "⚠ 部署完成但有页面校验未通过，请检查上面的状态码。"
  exit 1
fi
