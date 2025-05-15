# ElevenLabs Speech-to-Text App

Ứng dụng web chuyển đổi giọng nói thành văn bản sử dụng ElevenLabs API.

## Cài đặt

1. Clone repo này
2. Cài đặt các phụ thuộc: `npm install`
3. Tạo file `.env` trong thư mục gốc của dự án và thêm API key của bạn:
```
REACT_APP_ELEVENLABS_API_KEY=your_api_key_here
```
4. Lấy API key từ trang: https://elevenlabs.io/app/account 
5. Khởi chạy ứng dụng: `npm start`

## Các tính năng

- Tải lên tệp âm thanh
- Ghi âm trực tiếp
- Chuyển đổi giọng nói thành văn bản với ElevenLabs API
- Hiển thị kết quả phiên âm với định dạng hội thoại
- Phát âm thanh và đánh dấu từ đang phát
- Chế độ toàn màn hình
- Sao chép kết quả
- Cắt audio/video để chỉ lấy phần quan trọng
- Tải xuống audio/video đã cắt

## Xử lý lỗi

Nếu bạn nhận được lỗi 422 (Unprocessable Content), hãy kiểm tra:

1. API key đã được cấu hình đúng trong file .env
2. Định dạng file âm thanh được hỗ trợ (MP3, WAV, M4A, FLAC)
3. Kích thước file không vượt quá giới hạn của API
4. Kiểm tra tài khoản ElevenLabs có đủ credit

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
