# GitHub 部署指南

## 準備工作

1. 確保已安裝 Git 和 Node.js
2. 在 GitHub 上建立新的倉庫（建議使用英文名稱，例如：`pro-lucky-draw`）

## 部署步驟

### 1. 初始化 Git 倉庫（如果尚未初始化）

```bash
git init
```

### 2. 添加所有文件並提交

```bash
git add .
git commit -m "Initial commit: 專業抽籤系統"
```

### 3. 連接到 GitHub 倉庫

將 `YOUR_USERNAME` 和 `YOUR_REPO_NAME` 替換為您的 GitHub 用戶名和倉庫名稱：

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

或使用 SSH：

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO_NAME.git
```

### 4. 推送到 GitHub

```bash
git branch -M main
git push -u origin main
```

### 5. 啟用 GitHub Pages

1. 進入您的 GitHub 倉庫頁面
2. 點擊右上角的 **Settings**（設定）
3. 在左側選單中找到 **Pages**
4. 在 **Source** 選項中，選擇 **GitHub Actions**
5. 保存設定

### 6. 自動部署

GitHub Actions 會自動偵測 `main` 分支的推送並觸發部署。

- 進入倉庫的 **Actions** 標籤頁可以查看部署進度
- 部署完成後，可以在 **Settings > Pages** 中找到您的網站 URL

## 更新部署

每次推送代碼到 `main` 分支時，GitHub Actions 會自動重新部署：

```bash
git add .
git commit -m "更新描述"
git push
```

## 注意事項

- 如果倉庫名稱包含中文，請在 `vite.config.ts` 中手動設置 `base` 路徑
- 首次部署可能需要幾分鐘時間
- 部署完成後，網站可能需要幾分鐘才能正常訪問

## 自訂域名（可選）

如果需要使用自訂域名：

1. 在倉庫的 **Settings > Pages** 中設定自訂域名
2. 將 `vite.config.ts` 中的 `base` 設為 `/`
3. 重新建置並部署
