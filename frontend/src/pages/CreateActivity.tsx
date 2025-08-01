import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  DatePicker,
  InputNumber,
  Button,
  Select,
  Upload,
  message,
  Card,
  Row,
  Col,
  Typography,
  Space,
  Divider,
} from 'antd';
import type { UploadFile, UploadChangeParam } from 'antd/es/upload';
import { PlusOutlined, HomeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import locale from 'antd/es/date-picker/locale/zh_CN';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useAuthStore } from '../stores/useAuthStore';

dayjs.locale('zh-cn');

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ACTIVITY_CATEGORIES = [
  '足球',
  '篮球',
  '排球',
  '网球',
  '羽毛球',
  '乒乓球',
  '游泳',
  '跑步',
  '健身',
  '瑜伽',
  '舞蹈',
  '其他'
];

const CreateActivity = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // 处理时间范围
      const [startTime, endTime] = values.timeRange;
      const registrationDeadline = values.registrationDeadline;

      // 处理图片上传
      const images = fileList.map(file => {
        if (file.response && file.response.url) {
          return file.response.url; // 从上传响应中获取图片URL
        }
        if (file.url) {
          return file.url; // 如果有直接的URL
        }
        return '';
      }).filter(url => url);
      
      console.log('图片处理详情:', {
        fileListCount: fileList.length,
        fileListDetails: fileList.map(f => ({
          name: f.name,
          status: f.status,
          url: f.url,
          response: f.response,
          hasResponse: !!f.response,
          responseUrl: f.response?.url
        })),
        extractedImages: images
      });

      console.log('创建活动 - 图片处理:', {
        fileList: fileList.map(f => ({ name: f.name, status: f.status, url: f.url, response: f.response })),
        processedImages: images
      });

      // 第一张图片作为封面（后端会自动处理这个逻辑，但前端也保持一致）
      const coverImage = images.length > 0 ? images[0] : undefined;

      console.log('创建活动 - 封面设置:', {
        coverImage,
        totalImages: images.length,
        allImages: images
      });

      // 准备提交的数据
      const activityData = {
        ...values,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        registrationDeadline: registrationDeadline.toISOString(),
        coverImage,
        images,
        tags: values.tags || [],
      };

      console.log('创建活动 - 提交数据:', activityData);

      // 删除timeRange字段，因为后端不需要
      delete activityData.timeRange;

      // 发送请求创建活动
      const response = await axios.post(`${API_BASE_URL}/activities`, activityData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      message.success('活动创建成功！');
      navigate(`/activities/${response.data.data.activity.id}`);
    } catch (error) {
      console.error('创建活动失败:', error);
      message.error('创建活动失败，请检查表单并重试');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = ({ fileList: newFileList }: UploadChangeParam<UploadFile>) => {
    setFileList(newFileList);
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传图片</div>
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>创建新活动</Title>
            <Button 
              icon={<HomeOutlined />} 
              onClick={() => navigate('/')}
              type="default"
            >
              返回首页
            </Button>
          </div>
        }
        style={{ maxWidth: 1000, margin: '0 auto', marginTop: 20 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            price: 0,
            maxParticipants: 10,
          }}
        >
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="活动标题"
                rules={[{ required: true, message: '请输入活动标题' }]}
              >
                <Input placeholder="请输入活动标题" maxLength={100} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="category"
                label="活动类别"
                rules={[{ required: true, message: '请选择活动类别' }]}
              >
                <Select placeholder="请选择活动类别">
                  {ACTIVITY_CATEGORIES.map(category => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="location"
                label="活动地点"
                rules={[{ required: true, message: '请输入活动地点' }]}
              >
                <Input placeholder="请输入活动地点" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="timeRange"
                label="活动时间"
                rules={[{ required: true, message: '请选择活动时间' }]}
              >
                <RangePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  locale={locale}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="registrationDeadline"
                label="报名截止时间"
                rules={[{ required: true, message: '请选择报名截止时间' }]}
              >
                <DatePicker
                  showTime
                  format="YYYY-MM-DD HH:mm"
                  locale={locale}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="maxParticipants"
                label="最大参与人数"
                rules={[{ required: true, message: '请输入最大参与人数' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="price"
                label="活动价格（元）"
                rules={[{ required: true, message: '请输入活动价格' }]}
              >
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="description"
                label="活动描述"
                rules={[{ required: true, message: '请输入活动描述' }]}
              >
                <TextArea
                  placeholder="请详细描述活动内容、流程等信息"
                  rows={6}
                  maxLength={2000}
                  showCount
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="requirements"
                label="参与要求"
              >
                <TextArea
                  placeholder="请输入参与者需要满足的条件或需要准备的物品等"
                  rows={4}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="contactInfo"
                label="联系方式"
              >
                <Input placeholder="请输入联系方式，如电话、微信等" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="tags"
                label="活动标签"
              >
                <Select
                  mode="tags"
                  placeholder="请输入活动标签，按回车键确认"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="images"
                label="活动图片"
              >
                <Upload
                  action={`${API_BASE_URL}/upload`}
                  listType="picture-card"
                  fileList={fileList}
                  onChange={handleUploadChange}
                  name="image"
                  headers={{
                    Authorization: `Bearer ${token}`,
                  }}
                  beforeUpload={(file) => {
                    const isImage = file.type.startsWith('image/');
                    if (!isImage) {
                      message.error('只能上传图片文件!');
                    }
                    const isLt5M = file.size / 1024 / 1024 < 5;
                    if (!isLt5M) {
                      message.error('图片大小不能超过5MB!');
                    }
                    return isImage && isLt5M;
                  }}
                  onSuccess={(response, file) => {
                    console.log('图片上传成功:', { response, file });
                    // 更新fileList，添加服务器返回的URL
                    setFileList(prevList => 
                      prevList.map(item => 
                        item.uid === file.uid 
                          ? { ...item, status: 'done', response, url: response.url }
                          : item
                      )
                    );
                  }}
                  onError={(error, response, file) => {
                    console.error('图片上传失败:', { error, response, file });
                    message.error('图片上传失败，请重试');
                  }}
                >
                  {fileList.length >= 8 ? null : uploadButton}
                </Upload>
                <div>
                  <Text type="secondary">最多上传8张图片，每张不超过5MB</Text>
                  <br />
                  <Text type="warning" style={{ fontSize: '12px' }}>
                    💡 提示：第一张图片将自动设置为活动封面
                  </Text>
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建活动
              </Button>
              <Button onClick={() => navigate('/activities')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateActivity;