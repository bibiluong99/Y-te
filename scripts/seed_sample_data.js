const db = require('../db');

const sampleNews = [
  {
    title: "5 thói quen giúp tăng cường sức đề kháng mùa lạnh",
    category: "Kiến thức y khoa",
    author: "BS. Nguyễn Văn Minh",
    created_at: "20/05/2025",
    summary: "Uống đủ nước, tập thể dục nhẹ, ngủ đủ giấc là các thói quen hàng đầu giúp hệ thống miễn dịch hoạt động hiệu quả.",
    content: "Để bảo vệ sức khỏe khi thời tiết giao mùa, mỗi người cần duy trì chế độ sinh hoạt điều độ, bổ sung đầy đủ vitamin C, giữ ấm cơ thể và hạn chế tiếp xúc nơi đông người.\n\nĐặc biệt, việc tiêm phòng cúm hàng năm là biện pháp chủ động và hữu hiệu nhất để phòng ngừa các biến chứng nguy hiểm đường hô hấp đối với người cao tuổi và trẻ nhỏ.",
    image: "images/news-1.png",
    status: "published"
  },
  {
    title: "Dấu hiệu cảnh báo bệnh lý tim mạch sớm bạn không nên bỏ qua",
    category: "Bệnh học thường gặp",
    author: "BS. Lê Hoàng Anh",
    created_at: "15/05/2025",
    summary: "Đau thắt ngực, khó thở khi gắng sức, hồi hộp tim đập nhanh cần được thăm khám kịp thời.",
    content: "Bệnh lý tim mạch thường diễn tiến âm thầm. Việc tầm soát định kỳ ít nhất 6 tháng một lần giúp phát hiện nguy cơ xơ vữa động mạch từ giai đoạn sớm.\n\nKhi xuất hiện các triệu chứng như nặng ngực trái, hồi hộp, hoa mắt chóng mặt khi thay đổi tư thế, bạn nên đến cơ sở y tế gần nhất để đo điện tim và làm siêu âm tim chuyên sâu.",
    image: "images/banners/news-hero.jpg",
    status: "published"
  },
  {
    title: "Chế độ dinh dưỡng hợp lý cho cả gia đình trong thời điểm giao mùa",
    category: "Dinh dưỡng sức khỏe",
    author: "BS. Phạm Thị Mai",
    created_at: "10/05/2025",
    summary: "Cân đối đầy đủ 4 nhóm chất: đường bột, đạm, chất béo, vitamin và khoáng chất.",
    content: "Bữa ăn gia đình cần tăng cường rau xanh thẫm, các loại hạt dinh dưỡng và cá hồi giàu Omega-3 để cải thiện thị lực và hệ tim mạch.\n\nUống đủ 2 lít nước mỗi ngày và hạn chế đồ ngọt, nước có gas là chìa khóa vàng giúp duy trì cân nặng lý tưởng và chỉ số đường huyết ổn định.",
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600&h=400&fit=crop",
    status: "published"
  },
  {
    title: "Lợi ích của việc tập thể dục mỗi ngày đối với sức khỏe xương khớp",
    category: "Kiến thức y khoa",
    author: "BS. Đặng Văn Hùng",
    created_at: "05/05/2025",
    summary: "Duy trì 30 phút vận động mỗi ngày giúp tăng mật độ xương và giảm đau mỏi vai gáy rõ rệt.",
    content: "Các bài tập nhẹ nhàng như đi bộ nhanh, bơi lội hoặc yoga kích thích tái tạo dịch khớp, ngăn ngừa thoái hóa sớm.\n\nĐối với nhân viên văn phòng ngồi lâu, việc đứng dậy vận động nhẹ sau mỗi 45 phút làm việc giúp giải tỏa áp lực lên đĩa đệm cột sống cổ và thắt lưng.",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop",
    status: "published"
  },
  {
    title: "Tầm quan trọng của khám sức khỏe định kỳ ở độ tuổi 30+",
    category: "Kiến thức y khoa",
    author: "BS. Vũ Thị Ngọc",
    created_at: "01/05/2025",
    summary: "Chủ động kiểm tra các chỉ số mỡ máu, chức năng gan thận giúp phòng tránh biến chứng chuyển hóa.",
    content: "Người trên 30 tuổi thường chịu áp lực công việc và chế độ ăn thiếu cân bằng, là nguyên nhân hàng đầu dẫn đến gan nhiễm mỡ và gout.\n\nKhám sức khỏe tổng quát định kỳ giúp phát hiện sớm các dấu hiệu rối loạn chuyển hóa để kịp thời điều chỉnh lối sống trước khi bệnh tiến triển mãn tính.",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop",
    status: "published"
  },
  {
    title: "Dinh dưỡng cho trẻ em: Những vi chất quan trọng không thể thiếu",
    category: "Dinh dưỡng sức khỏe",
    author: "BS. Trần Thị Lan",
    created_at: "28/04/2025",
    summary: "Bổ sung Kẽm, Sắt, Canxi và Vitamin D3K2 giúp bé phát triển toàn diện chiều cao và trí tuệ.",
    content: "Chuyên gia khuyến cáo không nên lạm dụng kháng sinh mà hãy chú trọng tăng cường đề kháng tự nhiên cho trẻ qua dinh dưỡng cân đối và tiêm phòng vắc xin đúng lịch.",
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop",
    status: "published"
  }
];

const sampleDepartments = [
  {
    name: "Khám nội tổng quát",
    code: "NOI_TONG_QUAT",
    icon: "fas fa-stethoscope",
    image: "images/departments/noi-tong-quat.jpg",
    head_doctor: "BS. CKII. Nguyễn Văn Minh",
    description: "Kiểm tra sức khỏe toàn diện, chẩn đoán và điều trị các bệnh lý nội khoa mãn tính cho mọi lứa tuổi.",
    status: "active",
    sort_order: 1
  },
  {
    name: "Nhi khoa",
    code: "NHI_KHOA",
    icon: "fas fa-child",
    image: "images/departments/nhi-khoa.jpg",
    head_doctor: "BS. Trần Thị Lan",
    description: "Chăm sóc sức khỏe toàn diện, theo dõi phát triển thể chất và dinh dưỡng cho trẻ từ sơ sinh đến 15 tuổi.",
    status: "active",
    sort_order: 2
  },
  {
    name: "Sản phụ khoa",
    code: "SAN_PHU_KHOA",
    icon: "fas fa-baby",
    image: "images/departments/san-phu-khoa.jpg",
    head_doctor: "BS. CKI. Phạm Thị Mai",
    description: "Khám thai định kỳ, theo dõi sức khỏe mẹ và bé, tầm soát ung thư phụ khoa sớm bằng kỹ thuật hiện đại.",
    status: "active",
    sort_order: 3
  },
  {
    name: "Tim mạch",
    code: "TIM_MACH",
    icon: "fas fa-heartbeat",
    image: "images/departments/tim-mach.jpg",
    head_doctor: "PGS. TS. BS. Trần Quốc Bảo",
    description: "Tầm soát, chẩn đoán và điều trị tăng huyết áp, rối loạn nhịp tim và bệnh mạch vành.",
    status: "active",
    sort_order: 4
  },
  {
    name: "Hô hấp",
    code: "HO_HAP",
    icon: "fas fa-lungs",
    image: "images/departments/ho-hap.jpg",
    head_doctor: "BS. Đặng Văn Hùng",
    description: "Thăm khám và điều trị viêm phế quản, hen suyễn, COPD và các bệnh lý hô hấp thường gặp.",
    status: "active",
    sort_order: 5
  },
  {
    name: "Tiêu hóa",
    code: "TIEU_HOA",
    icon: "fas fa-stomach",
    image: "images/departments/tieu-hoa.jpg",
    head_doctor: "ThS. BS. Lê Hoàng Anh",
    description: "Nội soi tiêu hóa không đau, điều trị viêm loét dạ dày, trào ngược thực quản và bệnh lý đại tràng.",
    status: "active",
    sort_order: 6
  },
  {
    name: "Tiêm chủng",
    code: "TIEM_CHUNG",
    icon: "fas fa-syringe",
    image: "images/departments/tiem-chung.jpg",
    head_doctor: "BS. Trần Thị Lan",
    description: "Cung cấp đầy đủ các loại vắc xin chính hãng nhập khẩu, bảo quản chuẩn GSP cho trẻ em và người lớn.",
    status: "active",
    sort_order: 7
  },
  {
    name: "Da liễu",
    code: "DA_LIEU",
    icon: "fas fa-allergies",
    image: "images/departments/da-lieu.jpg",
    head_doctor: "BS. Vũ Thị Ngọc",
    description: "Khám và điều trị các bệnh viêm da cơ địa, dị ứng, mụn trứng cá và chăm sóc da thẩm mỹ chuyên sâu.",
    status: "active",
    sort_order: 8
  },
  {
    name: "Cơ xương khớp",
    code: "CO_XUONG_KHOP",
    icon: "fas fa-bone",
    image: "images/departments/co-xuong-khop.jpg",
    head_doctor: "ThS. BS. Lê Hoàng Anh",
    description: "Chẩn đoán thoái hóa khớp, thoát vị đĩa đệm, loãng xương và điều trị phục hồi chức năng vận động.",
    status: "active",
    sort_order: 9
  }
];

const sampleDoctors = [
  {
    name: 'BS. CKII. Nguyễn Văn Minh',
    degree: 'BS. CKII',
    department: 'Chuyên khoa Nội',
    experience: 'Hơn 15 năm kinh nghiệm',
    avatar: 'images/doc-1.png',
    description: 'Chuyên gia nội khoa tổng quát với hơn 15 năm kinh nghiệm chẩn đoán và điều trị bệnh mãn tính.',
    status: 'active',
    sort_order: 1
  },
  {
    name: 'BS. Trần Thị Lan',
    degree: 'Bác sĩ Chuyên khoa',
    department: 'Chuyên khoa Nhi',
    experience: 'Hơn 12 năm kinh nghiệm',
    avatar: 'images/doc-2.png',
    description: 'Bác sĩ chuyên khoa Nhi tận tâm, giàu kinh nghiệm chăm sóc sức khỏe và dinh dưỡng trẻ em.',
    status: 'active',
    sort_order: 2
  },
  {
    name: 'ThS. BS. Lê Hoàng Anh',
    degree: 'ThS. BS',
    department: 'Chuyên khoa Ngoại',
    experience: 'Hơn 14 năm kinh nghiệm',
    avatar: 'images/doc-3.png',
    description: 'Thạc sĩ Bác sĩ ngoại khoa có nhiều năm kinh nghiệm phẫu thuật và điều trị phục hồi chức năng.',
    status: 'active',
    sort_order: 3
  },
  {
    name: 'BS. CKI. Phạm Thị Mai',
    degree: 'BS. CKI',
    department: 'Chuyên khoa Sản',
    experience: 'Hơn 13 năm kinh nghiệm',
    avatar: 'images/doc-4.png',
    description: 'Bác sĩ Chuyên khoa I Sản phụ khoa, theo dõi thai kỳ an toàn và khám phụ khoa định kỳ.',
    status: 'active',
    sort_order: 4
  },
  {
    name: 'BS. Đặng Văn Hùng',
    degree: 'Bác sĩ Chuyên khoa',
    department: 'Chuyên khoa Tai Mũi Họng',
    experience: 'Hơn 10 năm kinh nghiệm',
    avatar: 'images/doc-5.png',
    description: 'Bác sĩ điều trị các bệnh lý viêm xoang, viêm họng hạt, nội soi tai mũi họng công nghệ cao.',
    status: 'active',
    sort_order: 5
  },
  {
    name: 'BS. Vũ Thị Ngọc',
    degree: 'Bác sĩ Chuyên khoa',
    department: 'Chuyên khoa Da liễu',
    experience: 'Hơn 11 năm kinh nghiệm',
    avatar: 'images/doc-6.png',
    description: 'Bác sĩ chuyên khoa Da liễu và thẩm mỹ da, trị mụn, nám, dị ứng và phục hồi da.',
    status: 'active',
    sort_order: 6
  }
];

const sampleServices = [
  {
    name: "Khám tổng quát",
    category: "Khám bệnh",
    icon: "fas fa-stethoscope",
    price: 300000,
    duration: "60 – 90 phút",
    description: "Kiểm tra sức khỏe toàn diện với đầy đủ các chỉ số cơ bản, phát hiện sớm các nguy cơ tiềm ẩn.",
    intro: "Khám tổng quát là bước kiểm tra sức khỏe cơ bản nhưng vô cùng quan trọng, giúp bạn nắm bắt tình trạng sức khỏe hiện tại, phát hiện sớm các bệnh lý tiềm ẩn và có hướng phòng ngừa kịp thời.\n\nTại Phòng khám đa khoa An Phúc, gói khám tổng quát được thiết kế khoa học với quy trình nhanh chóng, đội ngũ bác sĩ giàu kinh nghiệm và trang thiết bị hiện đại, mang đến trải nghiệm chăm sóc sức khỏe an toàn, tiện lợi và hiệu quả.",
    checklist: "Khám lâm sàng tổng quát\nSiêu âm ổ bụng\nXét nghiệm máu cơ bản\nĐo điện tim (ECG)\nXét nghiệm nước tiểu\nKiểm tra chức năng gan, thận\nChụp X-quang ngực\nTư vấn sức khỏe sau khám",
    banner: "images/banners/services-hero.jpg",
    status: "active"
  },
  {
    name: "Khám chuyên khoa",
    category: "Khám bệnh",
    icon: "fas fa-heartbeat",
    price: 350000,
    duration: "30 – 45 phút",
    description: "Tư vấn và điều trị chuyên sâu các bệnh lý Nội khoa, Nhi khoa, Ngoại khoa, Sản phụ khoa.",
    intro: "Khám chuyên khoa tại Phòng khám đa khoa An Phúc quy tụ các bác sĩ chuyên khoa đầu ngành các khoa Nội, Ngoại, Nhi, Sản phụ khoa, Tai Mũi Họng, Mắt và Da liễu.\n\nNgười bệnh được thăm khám kỹ lưỡng, chẩn đoán chính xác bằng các thiết bị nội soi và chẩn đoán chuyên sâu, từ đó xây dựng phác đồ điều trị cá thể hóa tối ưu nhất.",
    checklist: "Khám và tư vấn chuyên sâu cùng bác sĩ chuyên khoa\nĐo các chỉ số sinh hiệu và thể lực\nNội soi chẩn đoán chuyên khoa (nếu có chỉ định)\nChỉ định cận lâm sàng cần thiết\nKê đơn và hướng dẫn phác đồ điều trị\nHẹn tái khám và theo dõi định kỳ",
    banner: "images/banners/specialty-hero.jpg",
    status: "active"
  },
  {
    name: "Tiêm chủng",
    category: "Tiêm chủng",
    icon: "fas fa-syringe",
    price: 250000,
    duration: "15 – 30 phút",
    description: "Vắc xin an toàn, chất lượng cao nhập khẩu chính hãng cho trẻ em và người lớn.",
    intro: "Dịch vụ tiêm chủng trọn gói cho trẻ em và người lớn với các loại vắc xin chính hãng chất lượng cao, bảo quản theo tiêu chuẩn GSP quốc tế nghiêm ngặt.\n\nQuy trình tiêm chủng an toàn, khám sàng lọc trước tiêm và theo dõi chặt chẽ sau tiêm bởi đội ngũ bác sĩ, điều dưỡng lành nghề, tận tâm.",
    checklist: "Khám sàng lọc và tư vấn trước tiêm chủng\nKiểm tra đối chiếu thông tin vắc xin cùng khách hàng\nThực hiện tiêm chủng chuẩn vô khuẩn\nTheo dõi phản ứng sau tiêm tại chỗ 30 phút\nKiểm tra lại sức khỏe trước khi ra về\nCấp sổ tiêm chủng điện tử và nhắc lịch tiêm",
    banner: "images/departments/tiem-chung.jpg",
    status: "active"
  },
  {
    name: "Xét nghiệm",
    category: "Xét nghiệm",
    icon: "fas fa-vial",
    price: 400000,
    duration: "30 – 60 phút",
    description: "Chính xác, nhanh chóng với hệ thống máy sinh hóa và huyết học tự động hiện đại.",
    intro: "Trung tâm xét nghiệm An Phúc trang bị máy xét nghiệm tự động thế hệ mới, đạt tiêu chuẩn kiểm chuẩn chất lượng cao, đảm bảo kết quả chính xác và nhanh chóng nhất.\n\nĐầy đủ các xét nghiệm từ cơ bản đến chuyên sâu: huyết học, sinh hóa, miễn dịch, vi sinh, phân tích nước tiểu và tầm soát dấu ấn ung thư sớm.",
    checklist: "Lấy mẫu xét nghiệm chuẩn y khoa nhẹ nhàng\nXét nghiệm công thức máu toàn phần (24 thông số)\nXét nghiệm sinh hóa máu (đường huyết, mỡ máu, men gan)\nĐánh giá chức năng thận (Ure, Creatinine)\nXét nghiệm nước tiểu 10 thông số tự động\nTrả kết quả tận nơi hoặc tra cứu online bảo mật",
    banner: "images/quality-banner-bg.png",
    status: "active"
  },
  {
    name: "Chẩn đoán hình ảnh",
    category: "Chẩn đoán",
    icon: "fas fa-x-ray",
    price: 500000,
    duration: "20 – 40 phút",
    description: "Siêu âm màu 4D, X-quang kỹ thuật số, nội soi tiêu hóa không đau chuẩn xác.",
    intro: "Khoa Chẩn đoán hình ảnh Phòng khám đa khoa An Phúc ứng dụng các thiết bị y tế hiện đại hàng đầu: hệ thống Siêu âm màu Doppler 4D, máy chụp X-quang kỹ thuật số liều tia thấp và nội soi không đau.\n\nĐội ngũ bác sĩ giàu kinh nghiệm chẩn đoán hình ảnh trực tiếp thực hiện và hội chẩn, giúp phát hiện sớm các tổn thương bệnh lý nội tạng.",
    checklist: "Siêu âm Doppler màu 4D tổng quát ổ bụng\nSiêu âm tuyến giáp và vùng cổ\nChụp X-quang kỹ thuật số ngực thẳng liều thấp\nChụp X-quang xương khớp theo chỉ định\nNội soi tiêu hóa ống mềm không đau (nếu chỉ định)\nBác sĩ chuyên khoa đọc và hội chẩn kết quả chi tiết",
    banner: "images/banners/appointment-hero.jpg",
    status: "active"
  },
  {
    name: "Điều trị nội trú",
    category: "Khám bệnh",
    icon: "fas fa-procedures",
    price: 800000,
    duration: "Theo chỉ định bác sĩ",
    description: "Chăm sóc tận tâm trong không gian phòng bệnh tiện nghi, sạch sẽ, chuẩn y khoa.",
    intro: "Khu lưu trú và theo dõi điều trị An Phúc cung cấp dịch vụ chăm sóc toàn diện 24/7 với hệ thống phòng bệnh khang trang, sạch sẽ, vô trùng tuyệt đối.\n\nBệnh nhân được bác sĩ chuyên khoa thăm khám hàng ngày, điều dưỡng túc trực chăm sóc tận tình, mang lại cảm giác an tâm như ở nhà.",
    checklist: "Phòng bệnh tiêu chuẩn tiện nghi khép kín\nBác sĩ chuyên khoa thăm khám và hội chẩn hàng ngày\nĐiều dưỡng chăm sóc và hỗ trợ y tế 24/24\nChế độ dinh dưỡng điều trị riêng biệt theo bệnh lý\nTheo dõi sát sao chỉ số sinh tồn và diễn tiến bệnh\nHỗ trợ thủ tục bảo hiểm y tế nhanh gọn",
    banner: "images/hero-banner-full-doctor.png",
    status: "active"
  }
];

async function seed() {
  try {
    console.log('--- BẮT ĐẦU NẠP DỮ LIỆU MẪU ---');

    // 1. Tạo bảng news nếu chưa có
    await db.run(`
      CREATE TABLE IF NOT EXISTS news (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'Kiến thức y khoa',
        author TEXT DEFAULT 'BS. An Phúc',
        summary TEXT,
        content TEXT,
        image TEXT,
        created_at TEXT,
        updated_at DATETIME,
        status TEXT DEFAULT 'published'
      )
    `);

    // 2. Tạo bảng departments nếu chưa có
    await db.run(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        icon TEXT DEFAULT 'fas fa-stethoscope',
        image TEXT,
        head_doctor TEXT,
        description TEXT,
        status TEXT DEFAULT 'active',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Tạo bảng doctors nếu chưa có
    await db.run(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        degree TEXT,
        department TEXT NOT NULL,
        experience TEXT,
        avatar TEXT,
        description TEXT,
        status TEXT DEFAULT 'active',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Tạo bảng services nếu chưa có
    await db.run(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Khám bệnh',
        icon TEXT DEFAULT 'fas fa-stethoscope',
        price REAL DEFAULT 0,
        description TEXT,
        duration TEXT,
        intro TEXT,
        checklist TEXT,
        banner TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Xóa dữ liệu cũ nếu có
    await db.run("DELETE FROM news");
    await db.run("DELETE FROM departments");
    await db.run("DELETE FROM doctors");
    await db.run("DELETE FROM services");

    // Thêm News
    for (const n of sampleNews) {
      await db.run(
        "INSERT INTO news (title, category, author, summary, content, image, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [n.title, n.category, n.author, n.summary, n.content, n.image, n.created_at, n.status]
      );
    }
    console.log(`✅ Đã nạp ${sampleNews.length} bài viết Tin tức`);

    // Thêm Departments
    for (const d of sampleDepartments) {
      await db.run(
        "INSERT INTO departments (name, code, icon, image, head_doctor, description, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [d.name, d.code, d.icon, d.image, d.head_doctor, d.description, d.status, d.sort_order]
      );
    }
    console.log(`✅ Đã nạp ${sampleDepartments.length} Chuyên khoa y tế`);

    // Thêm Doctors
    for (const doc of sampleDoctors) {
      await db.run(
        "INSERT INTO doctors (name, degree, department, experience, avatar, description, status, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [doc.name, doc.degree, doc.department, doc.experience, doc.avatar, doc.description, doc.status, doc.sort_order]
      );
    }
    console.log(`✅ Đã nạp ${sampleDoctors.length} Bác sĩ y khoa`);

    // Thêm Services
    for (const s of sampleServices) {
      await db.run(
        "INSERT INTO services (name, category, icon, price, description, duration, intro, checklist, banner, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [s.name, s.category, s.icon, s.price, s.description, s.duration, s.intro, s.checklist, s.banner, s.status]
      );
    }
    console.log(`✅ Đã nạp ${sampleServices.length} Dịch vụ y tế`);

    // Đồng bộ vào JSON Store Fallback để dự phòng
    const store = db.getStore();
    if (store) {
      store.news = sampleNews.map((n, i) => ({ ...n, id: i + 1 }));
      store.departments = sampleDepartments.map((d, i) => ({ ...d, id: i + 1 }));
      store.doctors = sampleDoctors.map((doc, i) => ({ ...doc, id: i + 1 }));
      store.services = sampleServices.map((s, i) => ({ ...s, id: i + 1 }));
      db.saveStore();
      console.log('✅ Đã đồng bộ vào db_fallback_data.json');
    }

    console.log('🎉 NẠP TOÀN BỘ DATA MẪU THÀNH CÔNG VÀO SQL SERVER!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi nạp dữ liệu:', err);
    process.exit(1);
  }
}

setTimeout(seed, 1200);
