// =========================================================
//  CALENDAR CORE — Lịch Âm Dương & Tiết Khí
//  (Logic gốc giữ nguyên 100%, chỉ tách file + bổ sung các hàm
//   NL_* ở cuối để làm "cầu nối" dữ liệu cho lớp Ngũ Linh Engine)
// =========================================================

// =========================================================
//  TIẾT KHÍ DATA — giờ Việt Nam (ICT, UTC+7)
//  2023–2025: xấp xỉ (Meeus). 2026–2046: dữ liệu chính xác
//  do người dùng cung cấp (nguồn thayhuyenphongthuy.com).
// =========================================================
const solarTermsDB = {
    2023: {
        1:  [{ name:"Tiểu Hàn",   day:5,  time:"23:05" }, { name:"Đại Hàn",    day:20, time:"16:30" }],
        2:  [{ name:"Lập Xuân",   day:4,  time:"10:43" }, { name:"Vũ Thủy",    day:19, time:"06:35" }],
        3:  [{ name:"Kinh Trập",  day:6,  time:"04:37" }, { name:"Xuân Phân",  day:21, time:"05:25" }],
        4:  [{ name:"Thanh Minh", day:5,  time:"09:13" }, { name:"Cốc Vũ",     day:20, time:"20:14" }],
        5:  [{ name:"Lập Hạ",     day:6,  time:"03:19" }, { name:"Tiểu Mãn",   day:21, time:"16:09" }],
        6:  [{ name:"Mang Chủng", day:6,  time:"07:18" }, { name:"Hạ Chí",     day:21, time:"21:58" }],
        7:  [{ name:"Tiểu Thử",   day:7,  time:"17:31" }, { name:"Đại Thử",    day:23, time:"10:50" }],
        8:  [{ name:"Lập Thu",    day:8,  time:"03:23" }, { name:"Xử Thử",     day:23, time:"18:01" }],
        9:  [{ name:"Bạch Lộ",    day:8,  time:"06:27" }, { name:"Thu Phân",   day:23, time:"16:50" }],
        10: [{ name:"Hàn Lộ",     day:8,  time:"21:16" }, { name:"Sương Giáng",day:24, time:"00:21" }],
        11: [{ name:"Lập Đông",   day:8,  time:"01:36" }, { name:"Tiểu Tuyết", day:22, time:"23:03" }],
        12: [{ name:"Đại Tuyết",  day:7,  time:"18:33" }, { name:"Đông Chí",   day:22, time:"11:28" }]
    },
    2024: {
        1:  [{ name:"Tiểu Hàn",   day:6,  time:"05:00" }, { name:"Đại Hàn",    day:20, time:"22:07" }],
        2:  [{ name:"Lập Xuân",   day:4,  time:"16:27" }, { name:"Vũ Thủy",    day:19, time:"12:13" }],
        3:  [{ name:"Kinh Trập",  day:5,  time:"10:23" }, { name:"Xuân Phân",  day:20, time:"11:07" }],
        4:  [{ name:"Thanh Minh", day:4,  time:"15:02" }, { name:"Cốc Vũ",     day:20, time:"02:00" }],
        5:  [{ name:"Lập Hạ",     day:5,  time:"09:10" }, { name:"Tiểu Mãn",   day:20, time:"22:00" }],
        6:  [{ name:"Mang Chủng", day:5,  time:"13:10" }, { name:"Hạ Chí",     day:21, time:"04:51" }],
        7:  [{ name:"Tiểu Thử",   day:6,  time:"23:20" }, { name:"Đại Thử",    day:22, time:"16:44" }],
        8:  [{ name:"Lập Thu",    day:7,  time:"09:09" }, { name:"Xử Thử",     day:22, time:"23:55" }],
        9:  [{ name:"Bạch Lộ",    day:7,  time:"12:11" }, { name:"Thu Phân",   day:22, time:"22:44" }],
        10: [{ name:"Hàn Lộ",     day:8,  time:"04:00" }, { name:"Sương Giáng",day:23, time:"07:15" }],
        11: [{ name:"Lập Đông",   day:7,  time:"07:20" }, { name:"Tiểu Tuyết", day:22, time:"04:57" }],
        12: [{ name:"Đại Tuyết",  day:7,  time:"00:17" }, { name:"Đông Chí",   day:21, time:"17:21" }]
    },
    2025: {
        1:  [{ name:"Tiểu Hàn",   day:5,  time:"22:34" }, { name:"Đại Hàn",    day:20, time:"16:00" }],
        2:  [{ name:"Lập Xuân",   day:3,  time:"16:34" }, { name:"Vũ Thủy",    day:18, time:"12:27" }],
        3:  [{ name:"Kinh Trập",  day:5,  time:"10:36" }, { name:"Xuân Phân",  day:20, time:"11:01" }],
        4:  [{ name:"Thanh Minh", day:4,  time:"15:12" }, { name:"Cốc Vũ",     day:20, time:"02:19" }],
        5:  [{ name:"Lập Hạ",     day:5,  time:"08:36" }, { name:"Tiểu Mãn",   day:20, time:"21:11" }],
        6:  [{ name:"Mang Chủng", day:5,  time:"12:39" }, { name:"Hạ Chí",     day:21, time:"04:42" }],
        7:  [{ name:"Tiểu Thử",   day:7,  time:"05:05" }, { name:"Đại Thử",    day:22, time:"22:29" }],
        8:  [{ name:"Lập Thu",    day:7,  time:"14:52" }, { name:"Xử Thử",     day:23, time:"05:34" }],
        9:  [{ name:"Bạch Lộ",    day:7,  time:"17:51" }, { name:"Thu Phân",   day:23, time:"03:19" }],
        10: [{ name:"Hàn Lộ",     day:8,  time:"09:41" }, { name:"Sương Giáng",day:23, time:"12:51" }],
        11: [{ name:"Lập Đông",   day:7,  time:"13:03" }, { name:"Tiểu Tuyết", day:22, time:"10:36" }],
        12: [{ name:"Đại Tuyết",  day:7,  time:"06:04" }, { name:"Đông Chí",   day:21, time:"23:03" }]
    },
    2026: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"15:23" }, { name:"Đại Hàn", day:20, time:"08:45" }],
        2:  [{ name:"Lập Xuân", day:4, time:"03:02" }, { name:"Vũ Thủy", day:18, time:"22:52" }],
        3:  [{ name:"Kinh Trập", day:5, time:"20:59" }, { name:"Xuân Phân", day:20, time:"21:46" }],
        4:  [{ name:"Thanh Minh", day:5, time:"01:40" }, { name:"Cốc Vũ", day:20, time:"08:39" }],
        5:  [{ name:"Lập Hạ", day:5, time:"18:48" }, { name:"Tiểu Mãn", day:21, time:"07:36" }],
        6:  [{ name:"Mang Chủng", day:5, time:"22:48" }, { name:"Hạ Chí", day:21, time:"15:24" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"08:57" }, { name:"Đại Thử", day:23, time:"02:13" }],
        8:  [{ name:"Lập Thu", day:7, time:"18:42" }, { name:"Xử Thử", day:23, time:"09:18" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"21:41" }, { name:"Thu Phân", day:23, time:"07:05" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"13:29" }, { name:"Sương Giáng", day:23, time:"16:38" }],
        11:  [{ name:"Lập Đông", day:7, time:"16:52" }, { name:"Tiểu Tuyết", day:22, time:"14:23" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"09:52" }, { name:"Đông Chí", day:22, time:"03:50" }],
    },
    2027: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"21:10" }, { name:"Đại Hàn", day:20, time:"14:29" }],
        2:  [{ name:"Lập Xuân", day:4, time:"08:46" }, { name:"Vũ Thủy", day:19, time:"04:33" }],
        3:  [{ name:"Kinh Trập", day:6, time:"02:39" }, { name:"Xuân Phân", day:21, time:"03:24" }],
        4:  [{ name:"Thanh Minh", day:5, time:"07:17" }, { name:"Cốc Vũ", day:20, time:"14:17" }],
        5:  [{ name:"Lập Hạ", day:6, time:"00:25" }, { name:"Tiểu Mãn", day:21, time:"13:18" }],
        6:  [{ name:"Mang Chủng", day:6, time:"04:25" }, { name:"Hạ Chí", day:21, time:"21:10" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"14:37" }, { name:"Đại Thử", day:23, time:"08:04" }],
        8:  [{ name:"Lập Thu", day:8, time:"00:26" }, { name:"Xử Thử", day:23, time:"15:14" }],
        9:  [{ name:"Bạch Lộ", day:8, time:"03:28" }, { name:"Thu Phân", day:23, time:"13:01" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"19:17" }, { name:"Sương Giáng", day:23, time:"22:32" }],
        11:  [{ name:"Lập Đông", day:7, time:"22:38" }, { name:"Tiểu Tuyết", day:22, time:"20:16" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"15:37" }, { name:"Đông Chí", day:22, time:"09:42" }],
    },
    2028: {
        1:  [{ name:"Tiểu Hàn", day:6, time:"02:54" }, { name:"Đại Hàn", day:20, time:"20:21" }],
        2:  [{ name:"Lập Xuân", day:4, time:"14:31" }, { name:"Vũ Thủy", day:19, time:"10:26" }],
        3:  [{ name:"Kinh Trập", day:5, time:"08:24" }, { name:"Xuân Phân", day:20, time:"09:17" }],
        4:  [{ name:"Thanh Minh", day:4, time:"13:03" }, { name:"Cốc Vũ", day:19, time:"20:09" }],
        5:  [{ name:"Lập Hạ", day:5, time:"06:12" }, { name:"Tiểu Mãn", day:20, time:"19:09" }],
        6:  [{ name:"Mang Chủng", day:5, time:"10:16" }, { name:"Hạ Chí", day:21, time:"03:02" }],
        7:  [{ name:"Tiểu Thử", day:6, time:"20:30" }, { name:"Đại Thử", day:22, time:"13:54" }],
        8:  [{ name:"Lập Thu", day:7, time:"06:21" }, { name:"Xử Thử", day:22, time:"21:00" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"09:22" }, { name:"Thu Phân", day:22, time:"18:45" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"01:08" }, { name:"Sương Giáng", day:23, time:"04:13" }],
        11:  [{ name:"Lập Đông", day:7, time:"04:27" }, { name:"Tiểu Tuyết", day:22, time:"01:54" }],
        12:  [{ name:"Đại Tuyết", day:6, time:"21:24" }, { name:"Đông Chí", day:21, time:"15:19" }],
    },
    2029: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"08:41" }, { name:"Đại Hàn", day:20, time:"02:00" }],
        2:  [{ name:"Lập Xuân", day:3, time:"20:20" }, { name:"Vũ Thủy", day:18, time:"16:07" }],
        3:  [{ name:"Kinh Trập", day:5, time:"14:17" }, { name:"Xuân Phân", day:20, time:"15:01" }],
        4:  [{ name:"Thanh Minh", day:4, time:"18:58" }, { name:"Cốc Vũ", day:20, time:"01:55" }],
        5:  [{ name:"Lập Hạ", day:5, time:"12:07" }, { name:"Tiểu Mãn", day:21, time:"00:55" }],
        6:  [{ name:"Mang Chủng", day:5, time:"16:09" }, { name:"Hạ Chí", day:21, time:"08:48" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"02:22" }, { name:"Đại Thử", day:22, time:"19:42" }],
        8:  [{ name:"Lập Thu", day:7, time:"12:11" }, { name:"Xử Thử", day:23, time:"02:51" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"15:11" }, { name:"Thu Phân", day:23, time:"00:38" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"06:58" }, { name:"Sương Giáng", day:23, time:"10:08" }],
        11:  [{ name:"Lập Đông", day:7, time:"10:16" }, { name:"Tiểu Tuyết", day:22, time:"07:49" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"03:13" }, { name:"Đông Chí", day:21, time:"21:14" }],
    },
    2030: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"14:30" }, { name:"Đại Hàn", day:20, time:"07:54" }],
        2:  [{ name:"Lập Xuân", day:4, time:"02:08" }, { name:"Vũ Thủy", day:18, time:"21:59" }],
        3:  [{ name:"Kinh Trập", day:5, time:"20:03" }, { name:"Xuân Phân", day:20, time:"20:52" }],
        4:  [{ name:"Thanh Minh", day:5, time:"00:40" }, { name:"Cốc Vũ", day:20, time:"07:43" }],
        5:  [{ name:"Lập Hạ", day:5, time:"17:46" }, { name:"Tiểu Mãn", day:21, time:"06:41" }],
        6:  [{ name:"Mang Chủng", day:5, time:"21:44" }, { name:"Hạ Chí", day:21, time:"14:31" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"07:55" }, { name:"Đại Thử", day:23, time:"01:24" }],
        8:  [{ name:"Lập Thu", day:7, time:"17:47" }, { name:"Xử Thử", day:23, time:"08:36" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"20:52" }, { name:"Thu Phân", day:23, time:"06:26" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"12:45" }, { name:"Sương Giáng", day:23, time:"16:00" }],
        11:  [{ name:"Lập Đông", day:7, time:"16:08" }, { name:"Tiểu Tuyết", day:22, time:"13:44" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"09:07" }, { name:"Đông Chí", day:22, time:"03:09" }],
    },
    2031: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"20:23" }, { name:"Đại Hàn", day:20, time:"13:47" }],
        2:  [{ name:"Lập Xuân", day:4, time:"07:58" }, { name:"Vũ Thủy", day:19, time:"03:50" }],
        3:  [{ name:"Kinh Trập", day:6, time:"01:50" }, { name:"Xuân Phân", day:21, time:"02:40" }],
        4:  [{ name:"Thanh Minh", day:5, time:"06:28" }, { name:"Cốc Vũ", day:20, time:"13:31" }],
        5:  [{ name:"Lập Hạ", day:5, time:"23:35" }, { name:"Tiểu Mãn", day:21, time:"12:27" }],
        6:  [{ name:"Mang Chủng", day:6, time:"03:35" }, { name:"Hạ Chí", day:21, time:"20:17" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"13:48" }, { name:"Đại Thử", day:23, time:"07:10" }],
        8:  [{ name:"Lập Thu", day:7, time:"23:42" }, { name:"Xử Thử", day:23, time:"14:23" }],
        9:  [{ name:"Bạch Lộ", day:8, time:"02:50" }, { name:"Thu Phân", day:23, time:"12:15" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"18:42" }, { name:"Sương Giáng", day:23, time:"21:49" }],
        11:  [{ name:"Lập Đông", day:7, time:"22:05" }, { name:"Tiểu Tuyết", day:22, time:"19:32" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"15:02" }, { name:"Đông Chí", day:22, time:"08:55" }],
    },
    2032: {
        1:  [{ name:"Tiểu Hàn", day:6, time:"02:16" }, { name:"Đại Hàn", day:20, time:"19:31" }],
        2:  [{ name:"Lập Xuân", day:4, time:"13:48" }, { name:"Vũ Thủy", day:19, time:"09:32" }],
        3:  [{ name:"Kinh Trập", day:5, time:"07:40" }, { name:"Xuân Phân", day:20, time:"08:21" }],
        4:  [{ name:"Thanh Minh", day:4, time:"12:17" }, { name:"Cốc Vũ", day:19, time:"19:14" }],
        5:  [{ name:"Lập Hạ", day:5, time:"05:25" }, { name:"Tiểu Mãn", day:20, time:"18:14" }],
        6:  [{ name:"Mang Chủng", day:5, time:"09:27" }, { name:"Hạ Chí", day:21, time:"02:08" }],
        7:  [{ name:"Tiểu Thử", day:6, time:"19:40" }, { name:"Đại Thử", day:22, time:"13:04" }],
        8:  [{ name:"Lập Thu", day:7, time:"05:32" }, { name:"Xử Thử", day:22, time:"20:18" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"08:37" }, { name:"Thu Phân", day:22, time:"18:10" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"00:30" }, { name:"Sương Giáng", day:23, time:"03:46" }],
        11:  [{ name:"Lập Đông", day:7, time:"03:54" }, { name:"Tiểu Tuyết", day:22, time:"01:31" }],
        12:  [{ name:"Đại Tuyết", day:6, time:"20:53" }, { name:"Đông Chí", day:21, time:"14:55" }],
    },
    2033: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"08:08" }, { name:"Đại Hàn", day:20, time:"01:32" }],
        2:  [{ name:"Lập Xuân", day:3, time:"19:41" }, { name:"Vũ Thủy", day:18, time:"15:33" }],
        3:  [{ name:"Kinh Trập", day:5, time:"13:32" }, { name:"Xuân Phân", day:20, time:"14:22" }],
        4:  [{ name:"Thanh Minh", day:4, time:"18:08" }, { name:"Cốc Vũ", day:20, time:"01:13" }],
        5:  [{ name:"Lập Hạ", day:5, time:"11:13" }, { name:"Tiểu Mãn", day:21, time:"00:10" }],
        6:  [{ name:"Mang Chủng", day:5, time:"15:13" }, { name:"Hạ Chí", day:21, time:"08:01" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"01:24" }, { name:"Đại Thử", day:22, time:"18:52" }],
        8:  [{ name:"Lập Thu", day:7, time:"11:15" }, { name:"Xử Thử", day:23, time:"02:01" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"14:20" }, { name:"Thu Phân", day:22, time:"23:51" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"06:13" }, { name:"Sương Giáng", day:23, time:"09:27" }],
        11:  [{ name:"Lập Đông", day:7, time:"09:40" }, { name:"Tiểu Tuyết", day:22, time:"07:16" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"02:44" }, { name:"Đông Chí", day:21, time:"20:45" }],
    },
    2034: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"14:04" }, { name:"Đại Hàn", day:20, time:"07:27" }],
        2:  [{ name:"Lập Xuân", day:4, time:"01:41" }, { name:"Vũ Thủy", day:18, time:"21:30" }],
        3:  [{ name:"Kinh Trập", day:5, time:"19:32" }, { name:"Xuân Phân", day:20, time:"20:17" }],
        4:  [{ name:"Thanh Minh", day:5, time:"00:06" }, { name:"Cốc Vũ", day:20, time:"07:03" }],
        5:  [{ name:"Lập Hạ", day:5, time:"17:09" }, { name:"Tiểu Mãn", day:21, time:"05:56" }],
        6:  [{ name:"Mang Chủng", day:5, time:"21:06" }, { name:"Hạ Chí", day:21, time:"13:44" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"07:17" }, { name:"Đại Thử", day:23, time:"00:36" }],
        8:  [{ name:"Lập Thu", day:7, time:"17:08" }, { name:"Xử Thử", day:23, time:"07:47" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"20:13" }, { name:"Thu Phân", day:23, time:"05:39" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"12:06" }, { name:"Sương Giáng", day:23, time:"15:16" }],
        11:  [{ name:"Lập Đông", day:7, time:"15:33" }, { name:"Tiểu Tuyết", day:22, time:"13:04" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"08:36" }, { name:"Đông Chí", day:22, time:"02:33" }],
    },
    2035: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"19:55" }, { name:"Đại Hàn", day:20, time:"13:14" }],
        2:  [{ name:"Lập Xuân", day:4, time:"07:31" }, { name:"Vũ Thủy", day:19, time:"03:16" }],
        3:  [{ name:"Kinh Trập", day:6, time:"01:21" }, { name:"Xuân Phân", day:21, time:"02:02" }],
        4:  [{ name:"Thanh Minh", day:5, time:"05:53" }, { name:"Cốc Vũ", day:20, time:"12:48" }],
        5:  [{ name:"Lập Hạ", day:5, time:"22:54" }, { name:"Tiểu Mãn", day:21, time:"11:43" }],
        6:  [{ name:"Mang Chủng", day:6, time:"02:50" }, { name:"Hạ Chí", day:21, time:"19:32" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"13:00" }, { name:"Đại Thử", day:23, time:"06:28" }],
        8:  [{ name:"Lập Thu", day:7, time:"22:54" }, { name:"Xử Thử", day:23, time:"13:43" }],
        9:  [{ name:"Bạch Lộ", day:8, time:"02:02" }, { name:"Thu Phân", day:23, time:"11:38" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"17:57" }, { name:"Sương Giáng", day:23, time:"21:16" }],
        11:  [{ name:"Lập Đông", day:7, time:"21:23" }, { name:"Tiểu Tuyết", day:22, time:"19:03" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"14:25" }, { name:"Đông Chí", day:22, time:"08:30" }],
    },
    2036: {
        1:  [{ name:"Tiểu Hàn", day:6, time:"01:43" }, { name:"Đại Hàn", day:20, time:"19:10" }],
        2:  [{ name:"Lập Xuân", day:4, time:"13:19" }, { name:"Vũ Thủy", day:19, time:"09:14" }],
        3:  [{ name:"Kinh Trập", day:5, time:"07:11" }, { name:"Xuân Phân", day:20, time:"08:02" }],
        4:  [{ name:"Thanh Minh", day:4, time:"11:46" }, { name:"Cốc Vũ", day:19, time:"18:50" }],
        5:  [{ name:"Lập Hạ", day:5, time:"04:49" }, { name:"Tiểu Mãn", day:20, time:"17:44" }],
        6:  [{ name:"Mang Chủng", day:5, time:"08:46" }, { name:"Hạ Chí", day:21, time:"01:32" }],
        7:  [{ name:"Tiểu Thử", day:6, time:"18:57" }, { name:"Đại Thử", day:22, time:"12:22" }],
        8:  [{ name:"Lập Thu", day:7, time:"04:48" }, { name:"Xử Thử", day:22, time:"19:32" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"07:54" }, { name:"Thu Phân", day:22, time:"17:23" }],
        10:  [{ name:"Hàn Lộ", day:7, time:"23:48" }, { name:"Sương Giáng", day:23, time:"02:58" }],
        11:  [{ name:"Lập Đông", day:7, time:"03:14" }, { name:"Tiểu Tuyết", day:22, time:"00:45" }],
        12:  [{ name:"Đại Tuyết", day:6, time:"20:15" }, { name:"Đông Chí", day:21, time:"14:12" }],
    },
    2037: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"07:33" }, { name:"Đại Hàn", day:20, time:"00:53" }],
        2:  [{ name:"Lập Xuân", day:3, time:"19:11" }, { name:"Vũ Thủy", day:18, time:"14:58" }],
        3:  [{ name:"Kinh Trập", day:5, time:"13:05" }, { name:"Xuân Phân", day:20, time:"13:50" }],
        4:  [{ name:"Thanh Minh", day:4, time:"17:43" }, { name:"Cốc Vũ", day:20, time:"00:40" }],
        5:  [{ name:"Lập Hạ", day:5, time:"10:49" }, { name:"Tiểu Mãn", day:20, time:"23:35" }],
        6:  [{ name:"Mang Chủng", day:5, time:"14:46" }, { name:"Hạ Chí", day:21, time:"07:22" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"00:54" }, { name:"Đại Thử", day:22, time:"18:12" }],
        8:  [{ name:"Lập Thu", day:7, time:"10:42" }, { name:"Xử Thử", day:23, time:"01:21" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"13:45" }, { name:"Thu Phân", day:22, time:"23:12" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"05:37" }, { name:"Sương Giáng", day:23, time:"08:49" }],
        11:  [{ name:"Lập Đông", day:7, time:"09:03" }, { name:"Tiểu Tuyết", day:22, time:"06:38" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"02:07" }, { name:"Đông Chí", day:21, time:"20:07" }],
    },
    2038: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"13:26" }, { name:"Đại Hàn", day:20, time:"06:48" }],
        2:  [{ name:"Lập Xuân", day:4, time:"01:03" }, { name:"Vũ Thủy", day:18, time:"20:51" }],
        3:  [{ name:"Kinh Trập", day:5, time:"18:55" }, { name:"Xuân Phân", day:20, time:"19:40" }],
        4:  [{ name:"Thanh Minh", day:4, time:"23:29" }, { name:"Cốc Vũ", day:20, time:"06:28" }],
        5:  [{ name:"Lập Hạ", day:5, time:"16:30" }, { name:"Tiểu Mãn", day:21, time:"05:22" }],
        6:  [{ name:"Mang Chủng", day:5, time:"20:25" }, { name:"Hạ Chí", day:21, time:"13:09" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"06:32" }, { name:"Đại Thử", day:22, time:"23:59" }],
        8:  [{ name:"Lập Thu", day:7, time:"16:21" }, { name:"Xử Thử", day:23, time:"07:09" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"19:26" }, { name:"Thu Phân", day:23, time:"05:02" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"11:21" }, { name:"Sương Giáng", day:23, time:"14:40" }],
        11:  [{ name:"Lập Đông", day:7, time:"14:50" }, { name:"Tiểu Tuyết", day:22, time:"12:31" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"07:56" }, { name:"Đông Chí", day:22, time:"02:02" }],
    },
    2039: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"19:16" }, { name:"Đại Hàn", day:20, time:"12:43" }],
        2:  [{ name:"Lập Xuân", day:4, time:"06:52" }, { name:"Vũ Thủy", day:19, time:"02:45" }],
        3:  [{ name:"Kinh Trập", day:6, time:"00:42" }, { name:"Xuân Phân", day:21, time:"01:31" }],
        4:  [{ name:"Thanh Minh", day:5, time:"05:15" }, { name:"Cốc Vũ", day:20, time:"12:17" }],
        5:  [{ name:"Lập Hạ", day:5, time:"22:17" }, { name:"Tiểu Mãn", day:21, time:"11:10" }],
        6:  [{ name:"Mang Chủng", day:6, time:"02:15" }, { name:"Hạ Chí", day:21, time:"18:57" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"12:25" }, { name:"Đại Thử", day:23, time:"05:47" }],
        8:  [{ name:"Lập Thu", day:7, time:"22:17" }, { name:"Xử Thử", day:23, time:"12:58" }],
        9:  [{ name:"Bạch Lộ", day:8, time:"01:23" }, { name:"Thu Phân", day:23, time:"10:49" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"17:17" }, { name:"Sương Giáng", day:23, time:"20:24" }],
        11:  [{ name:"Lập Đông", day:7, time:"20:42" }, { name:"Tiểu Tuyết", day:22, time:"18:11" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"13:44" }, { name:"Đông Chí", day:22, time:"07:40" }],
    },
    2040: {
        1:  [{ name:"Tiểu Hàn", day:6, time:"01:03" }, { name:"Đại Hàn", day:20, time:"18:20" }],
        2:  [{ name:"Lập Xuân", day:4, time:"12:39" }, { name:"Vũ Thủy", day:19, time:"08:23" }],
        3:  [{ name:"Kinh Trập", day:5, time:"06:30" }, { name:"Xuân Phân", day:20, time:"07:11" }],
        4:  [{ name:"Thanh Minh", day:4, time:"11:05" }, { name:"Cốc Vũ", day:19, time:"17:59" }],
        5:  [{ name:"Lập Hạ", day:5, time:"04:09" }, { name:"Tiểu Mãn", day:20, time:"16:55" }],
        6:  [{ name:"Mang Chủng", day:5, time:"08:07" }, { name:"Hạ Chí", day:21, time:"00:46" }],
        7:  [{ name:"Tiểu Thử", day:6, time:"18:18" }, { name:"Đại Thử", day:22, time:"11:40" }],
        8:  [{ name:"Lập Thu", day:7, time:"04:09" }, { name:"Xử Thử", day:22, time:"18:53" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"07:13" }, { name:"Thu Phân", day:22, time:"16:44" }],
        10:  [{ name:"Hàn Lộ", day:7, time:"23:05" }, { name:"Sương Giáng", day:23, time:"02:19" }],
        11:  [{ name:"Lập Đông", day:7, time:"02:29" }, { name:"Tiểu Tuyết", day:22, time:"00:05" }],
        12:  [{ name:"Đại Tuyết", day:6, time:"19:29" }, { name:"Đông Chí", day:21, time:"13:32" }],
    },
    2041: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"06:47" }, { name:"Đại Hàn", day:20, time:"00:13" }],
        2:  [{ name:"Lập Xuân", day:3, time:"18:24" }, { name:"Vũ Thủy", day:18, time:"14:16" }],
        3:  [{ name:"Kinh Trập", day:5, time:"12:17" }, { name:"Xuân Phân", day:20, time:"13:06" }],
        4:  [{ name:"Thanh Minh", day:4, time:"16:52" }, { name:"Cốc Vũ", day:19, time:"23:54" }],
        5:  [{ name:"Lập Hạ", day:5, time:"09:54" }, { name:"Tiểu Mãn", day:20, time:"22:48" }],
        6:  [{ name:"Mang Chủng", day:5, time:"13:49" }, { name:"Hạ Chí", day:21, time:"06:35" }],
        7:  [{ name:"Tiểu Thử", day:6, time:"23:58" }, { name:"Đại Thử", day:22, time:"17:26" }],
        8:  [{ name:"Lập Thu", day:7, time:"09:48" }, { name:"Xử Thử", day:23, time:"00:35" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"12:53" }, { name:"Thu Phân", day:22, time:"22:26" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"04:46" }, { name:"Sương Giáng", day:23, time:"08:01" }],
        11:  [{ name:"Lập Đông", day:7, time:"08:12" }, { name:"Tiểu Tuyết", day:22, time:"05:48" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"01:15" }, { name:"Đông Chí", day:21, time:"19:18" }],
    },
    2042: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"12:34" }, { name:"Đại Hàn", day:20, time:"05:59" }],
        2:  [{ name:"Lập Xuân", day:4, time:"00:12" }, { name:"Vũ Thủy", day:18, time:"20:04" }],
        3:  [{ name:"Kinh Trập", day:5, time:"18:05" }, { name:"Xuân Phân", day:20, time:"18:52" }],
        4:  [{ name:"Thanh Minh", day:4, time:"22:40" }, { name:"Cốc Vũ", day:20, time:"05:39" }],
        5:  [{ name:"Lập Hạ", day:5, time:"15:42" }, { name:"Tiểu Mãn", day:21, time:"04:30" }],
        6:  [{ name:"Mang Chủng", day:5, time:"19:37" }, { name:"Hạ Chí", day:21, time:"12:15" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"05:46" }, { name:"Đại Thử", day:22, time:"23:05" }],
        8:  [{ name:"Lập Thu", day:7, time:"15:38" }, { name:"Xử Thử", day:23, time:"06:17" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"18:45" }, { name:"Thu Phân", day:23, time:"04:11" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"10:40" }, { name:"Sương Giáng", day:23, time:"13:49" }],
        11:  [{ name:"Lập Đông", day:7, time:"14:07" }, { name:"Tiểu Tuyết", day:22, time:"11:37" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"07:08" }, { name:"Đông Chí", day:22, time:"01:03" }],
    },
    2043: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"18:25" }, { name:"Đại Hàn", day:20, time:"11:41" }],
        2:  [{ name:"Lập Xuân", day:4, time:"05:58" }, { name:"Vũ Thủy", day:19, time:"01:41" }],
        3:  [{ name:"Kinh Trập", day:5, time:"23:47" }, { name:"Xuân Phân", day:21, time:"00:27" }],
        4:  [{ name:"Thanh Minh", day:5, time:"04:19" }, { name:"Cốc Vũ", day:20, time:"11:14" }],
        5:  [{ name:"Lập Hạ", day:5, time:"21:21" }, { name:"Tiểu Mãn", day:21, time:"10:08" }],
        6:  [{ name:"Mang Chủng", day:6, time:"01:17" }, { name:"Hạ Chí", day:21, time:"17:58" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"11:27" }, { name:"Đại Thử", day:23, time:"04:53" }],
        8:  [{ name:"Lập Thu", day:7, time:"21:20" }, { name:"Xử Thử", day:23, time:"12:09" }],
        9:  [{ name:"Bạch Lộ", day:8, time:"00:29" }, { name:"Thu Phân", day:23, time:"10:06" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"16:27" }, { name:"Sương Giáng", day:23, time:"19:46" }],
        11:  [{ name:"Lập Đông", day:7, time:"19:55" }, { name:"Tiểu Tuyết", day:22, time:"17:34" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"12:57" }, { name:"Đông Chí", day:22, time:"07:00" }],
    },
    2044: {
        1:  [{ name:"Tiểu Hàn", day:6, time:"00:12" }, { name:"Đại Hàn", day:20, time:"17:37" }],
        2:  [{ name:"Lập Xuân", day:4, time:"11:43" }, { name:"Vũ Thủy", day:19, time:"07:35" }],
        3:  [{ name:"Kinh Trập", day:5, time:"05:31" }, { name:"Xuân Phân", day:20, time:"06:20" }],
        4:  [{ name:"Thanh Minh", day:4, time:"10:02" }, { name:"Cốc Vũ", day:19, time:"17:06" }],
        5:  [{ name:"Lập Hạ", day:5, time:"03:05" }, { name:"Tiểu Mãn", day:20, time:"16:01" }],
        6:  [{ name:"Mang Chủng", day:5, time:"07:03" }, { name:"Hạ Chí", day:20, time:"23:50" }],
        7:  [{ name:"Tiểu Thử", day:6, time:"17:15" }, { name:"Đại Thử", day:22, time:"10:42" }],
        8:  [{ name:"Lập Thu", day:7, time:"03:08" }, { name:"Xử Thử", day:22, time:"17:54" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"06:16" }, { name:"Thu Phân", day:22, time:"15:47" }],
        10:  [{ name:"Hàn Lộ", day:7, time:"22:12" }, { name:"Sương Giáng", day:23, time:"01:25" }],
        11:  [{ name:"Lập Đông", day:7, time:"01:41" }, { name:"Tiểu Tuyết", day:21, time:"23:14" }],
        12:  [{ name:"Đại Tuyết", day:6, time:"18:44" }, { name:"Đông Chí", day:21, time:"12:43" }],
    },
    2045: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"06:02" }, { name:"Đại Hàn", day:19, time:"23:21" }],
        2:  [{ name:"Lập Xuân", day:3, time:"17:35" }, { name:"Vũ Thủy", day:18, time:"13:21" }],
        3:  [{ name:"Kinh Trập", day:5, time:"11:24" }, { name:"Xuân Phân", day:20, time:"12:07" }],
        4:  [{ name:"Thanh Minh", day:4, time:"15:56" }, { name:"Cốc Vũ", day:19, time:"22:52" }],
        5:  [{ name:"Lập Hạ", day:5, time:"08:59" }, { name:"Tiểu Mãn", day:20, time:"21:45" }],
        6:  [{ name:"Mang Chủng", day:5, time:"12:56" }, { name:"Hạ Chí", day:21, time:"05:33" }],
        7:  [{ name:"Tiểu Thử", day:6, time:"23:07" }, { name:"Đại Thử", day:22, time:"16:26" }],
        8:  [{ name:"Lập Thu", day:7, time:"08:59" }, { name:"Xử Thử", day:22, time:"23:38" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"12:05" }, { name:"Thu Phân", day:22, time:"21:32" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"04:00" }, { name:"Sương Giáng", day:23, time:"07:12" }],
        11:  [{ name:"Lập Đông", day:7, time:"07:29" }, { name:"Tiểu Tuyết", day:22, time:"05:03" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"00:35" }, { name:"Đông Chí", day:21, time:"18:34" }],
    },
    2046: {
        1:  [{ name:"Tiểu Hàn", day:5, time:"11:55" }, { name:"Đại Hàn", day:20, time:"05:15" }],
        2:  [{ name:"Lập Xuân", day:3, time:"23:30" }, { name:"Vũ Thủy", day:18, time:"19:15" }],
        3:  [{ name:"Kinh Trập", day:5, time:"17:17" }, { name:"Xuân Phân", day:20, time:"17:57" }],
        4:  [{ name:"Thanh Minh", day:4, time:"21:44" }, { name:"Cốc Vũ", day:20, time:"04:38" }],
        5:  [{ name:"Lập Hạ", day:5, time:"14:40" }, { name:"Tiểu Mãn", day:21, time:"03:28" }],
        6:  [{ name:"Mang Chủng", day:5, time:"18:31" }, { name:"Hạ Chí", day:21, time:"11:14" }],
        7:  [{ name:"Tiểu Thử", day:7, time:"04:39" }, { name:"Đại Thử", day:22, time:"22:08" }],
        8:  [{ name:"Lập Thu", day:7, time:"14:32" }, { name:"Xử Thử", day:23, time:"05:24" }],
        9:  [{ name:"Bạch Lộ", day:7, time:"17:42" }, { name:"Thu Phân", day:23, time:"03:21" }],
        10:  [{ name:"Hàn Lộ", day:8, time:"09:41" }, { name:"Sương Giáng", day:23, time:"13:03" }],
        11:  [{ name:"Lập Đông", day:7, time:"13:13" }, { name:"Tiểu Tuyết", day:22, time:"10:55" }],
        12:  [{ name:"Đại Tuyết", day:7, time:"06:20" }, { name:"Đông Chí", day:22, time:"00:28" }],
    }
};

// 12 "Tiết" (khác "Khí") mở đầu mỗi tháng Nguyệt Lệnh thật — dùng để tính
// Lịch Tiết Khí. Đây LUÔN là phần tử đầu tiên [0] của mỗi mảng tháng ở trên.
const TIET_TO_CHI = {
    "Tiểu Hàn":"Sửu", "Lập Xuân":"Dần", "Kinh Trập":"Mão", "Thanh Minh":"Thìn",
    "Lập Hạ":"Tỵ", "Mang Chủng":"Ngọ", "Tiểu Thử":"Mùi", "Lập Thu":"Thân",
    "Bạch Lộ":"Dậu", "Hàn Lộ":"Tuất", "Lập Đông":"Hợi", "Đại Tuyết":"Tý"
};
const CHI_FROM_DAN = ['Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi','Tý','Sửu'];
const THIEN_CAN = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];

function getSolarTermsForMonth(year, month) {
    if (solarTermsDB[year] && solarTermsDB[year][month]) return solarTermsDB[year][month];
    return [];
}
function getTietKhiForDay(year, month, day) {
    const terms = getSolarTermsForMonth(year, month);
    const term = terms.find(t => t.day === day);
    return term ? term.name : null;
}

// Giờ trong data là giờ ICT (UTC+7) — quy đổi đúng sang mốc UTC thật để so
// sánh chính xác với "now", không phụ thuộc múi giờ trình duyệt người dùng.
function ictInstant(year, month, day, hh, mm) {
    return new Date(Date.UTC(year, month - 1, day, hh - 7, mm));
}

// Dựng "trục thời gian Tiết" (12 mốc/năm) trải toàn bộ solarTermsDB.
let _tietTimeline = null;
function buildTietTimeline() {
    if (_tietTimeline) return _tietTimeline;
    const list = [];
    Object.keys(solarTermsDB).map(Number).sort((a,b)=>a-b).forEach(year => {
        for (let m = 1; m <= 12; m++) {
            const terms = solarTermsDB[year][m];
            if (!terms || !terms.length) continue;
            const t = terms[0]; // phần tử [0] luôn là "Tiết" mở tháng
            if (!TIET_TO_CHI[t.name]) continue;
            const [hh, mm] = t.time.split(':').map(Number);
            list.push({
                name: t.name, chi: TIET_TO_CHI[t.name], year: year,
                day: t.day, month: m, hh, mm,
                instant: ictInstant(year, m, t.day, hh, mm)
            });
        }
    });
    list.sort((a,b) => a.instant - b.instant);
    _tietTimeline = list;
    return list;
}

const DIA_CHI_CHUAN = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
function canChiNamThat(year) {
    const canIdx = ((year - 4) % 10 + 10) % 10;
    const chiIdx = ((year - 4) % 12 + 12) % 12;
    return { can: THIEN_CAN[canIdx], chi: DIA_CHI_CHUAN[chiIdx], text: THIEN_CAN[canIdx] + ' ' + DIA_CHI_CHUAN[chiIdx] };
}

// Ngũ Hổ Độn: Can của tháng Dần theo Can của Năm (Tiết niên).
function stemOfDanFromYearCan(yearCanIdx) {
    return (2 * (yearCanIdx % 5) + 2) % 10;
}

/**
 * Tính Tháng/Năm theo TIẾT KHÍ THẬT cho một thời điểm bất kỳ (đối tượng Date UTC).
 * Trả về null nếu nằm ngoài phạm vi dữ liệu (trước Tiểu Hàn 2023).
 */
function getTietKhiThangNam(dateObj) {
    const timeline = buildTietTimeline();
    let curIdx = -1;
    for (let i = 0; i < timeline.length; i++) {
        if (timeline[i].instant.getTime() <= dateObj.getTime()) curIdx = i; else break;
    }
    if (curIdx === -1) return null;
    const curTiet = timeline[curIdx];

    let yearIdx = -1;
    for (let i = 0; i <= curIdx; i++) {
        if (timeline[i].name === 'Lập Xuân') yearIdx = i;
    }
    if (yearIdx === -1) return null; // trước Lập Xuân đầu tiên trong DB

    const namCC = canChiNamThat(timeline[yearIdx].year);
    const yearCanIdx = THIEN_CAN.indexOf(namCC.can);
    const stemDan = stemOfDanFromYearCan(yearCanIdx);
    const offset = CHI_FROM_DAN.indexOf(curTiet.chi);
    const thangCanIdx = (stemDan + offset) % 10;
    const thangCC = { can: THIEN_CAN[thangCanIdx], chi: curTiet.chi, text: THIEN_CAN[thangCanIdx] + ' ' + curTiet.chi };

    return {
        thangCanChi: thangCC, namCanChi: namCC,
        tietHienHanh: curTiet.name, tietInstant: curTiet.instant,
        tietDay: curTiet.day, tietMonth: curTiet.month, tietYear: curTiet.year,
        tietHH: curTiet.hh, tietMM: curTiet.mm
    };
}

// Kiểm tra 1 ngày dương lịch cụ thể có phải "ngày giao Tiết" (đổi Nguyệt
// Lệnh) hay không — nếu có, trả về thông tin trước/sau mốc giờ giao Tiết.
function getTietTransitionOnDay(year, month, day) {
    const timeline = buildTietTimeline();
    const idx = timeline.findIndex(t => t.year === year && t.month === month && t.day === day);
    if (idx === -1 || idx === 0) return null;
    const before = timeline[idx - 1];
    const after  = timeline[idx];
    const nowThis = getTietKhiThangNam(ictInstant(year, month, day, after.hh, after.mm));
    const beforeThis = getTietKhiThangNam(new Date(before.instant.getTime()));
    return {
        gioGiao: `${String(after.hh).padStart(2,'0')}:${String(after.mm).padStart(2,'0')}`,
        tietTen: after.name,
        thangTruoc: beforeThis ? beforeThis.thangCanChi.text : '—',
        namTruoc: beforeThis ? beforeThis.namCanChi.text : '—',
        thangSau: nowThis ? nowThis.thangCanChi.text : '—',
        namSau: nowThis ? nowThis.namCanChi.text : '—',
        doiNam: after.name === 'Lập Xuân'
    };
}

const LunarDateLib = window._calendar;

function getSocVongInfo(year, month, day) {
    try {
        const sd = new LunarDateLib.SolarDate({ day, month, year });
        const ld = sd.toLunarDate();
        ld.init();
        return {
            lunarDisp: ld.day + '/' + ld.month + (ld.leap ? 'ⁿ' : ''),
            lunarDay:  ld.day + '/' + ld.month + (ld.leap ? ' nhuận' : ''),
            ngayCC:  ld.getDayName()   || 'N/A',
            thangCC: ld.getMonthName() || 'N/A',
            namCC:   ld.getYearName()  || 'N/A'
        };
    } catch (e) { return null; }
}

function currentRealYear() { return new Date().getFullYear(); }

// =========================================================
//  MODAL UTILS (dùng chung cho mọi modal, kể cả modal Ngũ Linh)
// =========================================================
function openModal(id) {
    document.getElementById(id).classList.add('active');
    const res = document.getElementById(id === 'calcDaysModal' ? 'calcResult' : 'findResult');
    if (res) { res.className = 'calc-result'; res.innerHTML = ''; }
}
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
function outsideClose(e, id) { if (e.target.id === id) closeModal(id); }

// =========================================================
//  REAL-TIME DUAL BANNER
// =========================================================
function renderNowBanner() {
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    const y = now.getFullYear(), m = now.getMonth()+1, d = now.getDate();

    const soc = getSocVongInfo(y, m, d);
    const tiet = getTietKhiThangNam(now);

    const clockStr = `${pad(now.getHours())}:${pad(now.getMinutes())} — ${pad(d)}/${pad(m)}/${y} (Dương Lịch)`;

    let socHtml = '<div class="empty-note" style="color:rgba(255,255,255,.6)">Không đọc được lịch Sóc Vọng.</div>';
    if (soc) {
        socHtml = `
            <div class="now-line"><span>Ngày Âm</span><b>${soc.lunarDay}</b></div>
            <div class="now-line"><span>Can Chi Ngày</span><b>${soc.ngayCC}</b></div>
            <div class="now-line"><span>Can Chi Tháng</span><b>${soc.thangCC}</b></div>
            <div class="now-line"><span>Can Chi Năm</span><b>${soc.namCC}</b></div>`;
    }

    let tietHtml = '<div class="empty-note" style="color:rgba(255,255,255,.6)">Ngoài phạm vi dữ liệu Tiết Khí (2023–2046).</div>';
    let diffHtml = '';
    if (tiet) {
        const ngayCC = soc ? soc.ngayCC : 'N/A'; // Can Chi Ngày là một trục duy nhất, dùng chung
        tietHtml = `
            <div class="now-line"><span>Tiết hiện hành</span><b>${tiet.tietHienHanh}</b></div>
            <div class="now-line"><span>Can Chi Ngày</span><b>${ngayCC}</b></div>
            <div class="now-line"><span>Can Chi Tháng</span><b>${tiet.thangCanChi.text}</b></div>
            <div class="now-line"><span>Can Chi Năm</span><b>${tiet.namCanChi.text}</b></div>`;

        if (soc && (soc.thangCC !== tiet.thangCanChi.text || soc.namCC !== tiet.namCanChi.text)) {
            diffHtml = `<div class="now-diff-note show">⚠️ Lịch Sóc Vọng &amp; Tiết Khí đang LỆCH nhau tại thời điểm này — đã qua Tiết "${tiet.tietHienHanh}" (${pad(tiet.tietHH)}:${pad(tiet.tietMM)} ngày ${pad(tiet.tietDay)}/${pad(tiet.tietMonth)}/${tiet.tietYear}) nhưng ngày Sóc/Vọng mặt trăng chưa đổi tháng.</div>`;
        }
    }

    document.getElementById('nowBanner').innerHTML = `
        <div class="now-head">
            <span class="clock">🕐 ${clockStr}</span>
            <span class="refresh-note">tự cập nhật mỗi phút</span>
        </div>
        <div class="now-grid">
            <div class="now-card soc">
                <div class="now-card-label">🌙 Lịch Sóc Vọng (mặc định)</div>
                ${socHtml}
            </div>
            <div class="now-card tiet">
                <div class="now-card-label">☀️ Lịch Tiết Khí (Nguyệt Lệnh thật)</div>
                ${tietHtml}
            </div>
            ${diffHtml}
        </div>`;
}

// =========================================================
//  GENERATE CALENDAR
// =========================================================
function generateCalendar() {
    const month = parseInt(document.getElementById('month').value);
    const year  = parseInt(document.getElementById('year').value);
    const calDiv = document.getElementById('calendar');

    if (isNaN(year) || year < 1900 || year > 2100) {
        calDiv.innerHTML = '<p style="color:var(--red);padding:16px;font-weight:600;">Vui lòng nhập năm từ 1900 đến 2100.</p>';
        return;
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay    = new Date(year, month - 1, 1).getDay();

    const monthNames = ['','Tháng Một','Tháng Hai','Tháng Ba','Tháng Tư','Tháng Năm','Tháng Sáu',
                        'Tháng Bảy','Tháng Tám','Tháng Chín','Tháng Mười','Tháng Mười Một','Tháng Mười Hai'];

    const tietKhiNotes = buildTietKhiNotes(year, month);

    let tableHTML = `
    <table>
        <thead><tr><th>CN</th><th>T.2</th><th>T.3</th><th>T.4</th><th>T.5</th><th>T.6</th><th>T.7</th></tr></thead>
        <tbody>`;

    let day = 1, row = '<tr>', cellCount = 0;
    for (let i = 0; i < firstDay; i++) { row += '<td></td>'; cellCount++; }
    while (day <= daysInMonth) {
        row += getDayCell(year, month, day);
        cellCount++; day++;
        if (cellCount === 7) { tableHTML += row + '</tr>'; row = '<tr>'; cellCount = 0; }
    }
    if (cellCount > 0) {
        while (cellCount < 7) { row += '<td></td>'; cellCount++; }
        tableHTML += row + '</tr>';
    }
    tableHTML += '</tbody></table>';

    calDiv.innerHTML = `
        <div class="calendar-card">
            <div class="calendar-month-header">
                <h3>${monthNames[month]} ${year}</h3>
                <span>Lịch Âm Dương</span>
            </div>
            ${tableHTML}
        </div>
        ${tietKhiNotes}
    `;

    displayImportantDays(year, month);
    displayThienXaDays(year, month);
}

function buildTietKhiNotes(year, month) {
    const terms = getSolarTermsForMonth(year, month);
    if (terms.length === 0) {
        return `<div class="tietKhi-section">
            <h4>Tiết Khí Tháng Này</h4>
            <p class="tietKhi-unavail">Chưa có dữ liệu tiết khí cho năm ${year}. Dữ liệu có sẵn: 2023–2046.</p>
        </div>`;
    }
    const pad = n => String(n).padStart(2,'0');
    const listItems = terms.map(t =>
        `<li><span class="tk-name">${t.name}</span><span>—</span>
            <span>${pad(t.day)}/${pad(month)}/${year}</span>
            <span class="tk-time">${t.time} (ICT)</span></li>`
    ).join('');
    return `<div class="tietKhi-section">
        <h4>Tiết Khí Tháng Này</h4>
        <ul class="tietKhi-list">${listItems}</ul>
    </div>`;
}

function getDayCell(year, month, day) {
    const soc = getSocVongInfo(year, month, day);
    let lunarDisp = '?', lunarDay = 'N/A', canChiDay = 'N/A', canChiMonth = 'N/A', canChiYear = 'N/A';
    if (soc) {
        lunarDisp = soc.lunarDisp; lunarDay = soc.lunarDay;
        canChiDay = soc.ngayCC; canChiMonth = soc.thangCC; canChiYear = soc.namCC;
    }

    const tietKhi = getTietKhiForDay(year, month, day) || null;

    const weekday = new Date(year, month - 1, day).getDay();
    const now = new Date();
    const isToday = (day === now.getDate() && month === now.getMonth()+1 && year === now.getFullYear());

    let cls = '';
    if (weekday === 0) cls = 'sunday';
    if (weekday === 6) cls = 'saturday';
    if (isToday) cls += ' today';

    const tietKhiTag = tietKhi ? `<span class="day-tietKhi">${tietKhi}</span>` : '';
    const safeCC = s => s.replace(/'/g,"&#39;");

    return `<td class="${cls.trim()}" onclick="showDayDetail(${year},${month},${day},'${safeCC(lunarDay)}','${safeCC(canChiDay)}','${safeCC(canChiMonth)}','${safeCC(canChiYear)}')">
        <div class="day-cell-inner">
            <span class="day-solar">${day}</span>
            <span class="day-lunar">${lunarDisp}</span>
            ${tietKhiTag}
        </div>
    </td>`;
}

// =========================================================
//  SHOW DAY DETAIL MODAL — song song Sóc Vọng & Tiết Khí
//  + khối "Lập Quẻ Ngũ Linh" (tích hợp qua ngulinh-engine.js)
// =========================================================
function showDayDetail(year, month, day, lunarDay, canChiDay, canChiMonth, canChiYear) {
    const weekdays = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
    const wd = weekdays[new Date(year, month-1, day).getDay()];
    const pad = n => String(n).padStart(2,'0');
    const tietKhiExact = getTietKhiForDay(year, month, day);

    // Tiết Khí lúc 12:00 trưa ngày này (đại diện) — nếu ngày này có giao Tiết
    // thì sẽ có transition riêng hiển thị bên dưới.
    const tietNoon = getTietKhiThangNam(ictInstant(year, month, day, 12, 0));
    const transition = getTietTransitionOnDay(year, month, day);

    let tietBlock = '<p class="empty-note">Ngoài phạm vi dữ liệu Tiết Khí (2023–2046).</p>';
    if (tietNoon) {
        tietBlock = `
            <div class="detail-grid">
                <span class="lbl">Can Chi Ngày</span><span class="val canchi">${canChiDay}</span>
                <span class="lbl">Can Chi Tháng</span><span class="val canchi">${tietNoon.thangCanChi.text}</span>
                <span class="lbl">Can Chi Năm</span><span class="val canchi">${tietNoon.namCanChi.text}</span>
                <span class="lbl">Tiết hiện hành</span><span class="val tietKhi-val">${tietNoon.tietHienHanh}</span>
            </div>`;
    }

    let transitionBlock = '';
    if (transition) {
        transitionBlock = `<div class="transition-note">
            🔀 <b>Ngày giao Tiết "${transition.tietTen}"</b> lúc ${transition.gioGiao} (ICT).<br>
            Trước ${transition.gioGiao}: tháng <b>${transition.thangTruoc}</b>, năm <b>${transition.namTruoc}</b>.<br>
            Từ ${transition.gioGiao} trở đi: tháng <b>${transition.thangSau}</b>, năm <b>${transition.namSau}</b>${transition.doiNam ? ' <b>(sang năm Can Chi mới)</b>' : ''}.
        </div>`;
    }

    // --- Lưu lại ngày đang xem để nút "Lập Quẻ Ngũ Linh" sử dụng ---
    window.__nlSelectedDate = { year, month, day, canChiNgay: canChiDay };

    const nguLinhBlock = `
        <div class="detail-section-label" style="color:var(--violet)">🔮 Ngũ Linh</div>
        <div class="form-section" style="margin-bottom:0;">
            <label>Chọn giờ để lập quẻ</label>
            <div class="form-row">
                <select id="gioChiSelect" style="flex:1">${NL_renderGioSelectHtml()}</select>
            </div>
        </div>
        <button class="btn-primary" style="width:100%;background:var(--violet);margin-top:10px"
                onclick="window.NguLinhEngine && NguLinhEngine.layQue()">🔮 Ngũ Linh Dụng Sự</button>
    `;

    document.getElementById('modal-detail-content').innerHTML = `
        <div class="detail-date-badge">
            ${day}
            <small>${wd}, ${pad(day)}/${pad(month)}/${year}</small>
        </div>

        <div class="detail-section-label soc">🌙 Lịch Sóc Vọng (mặc định)</div>
        <div class="detail-grid">
            <span class="lbl">Âm lịch</span><span class="val highlight">${lunarDay}</span>
            <span class="lbl">Can Chi Ngày</span><span class="val canchi">${canChiDay}</span>
            <span class="lbl">Can Chi Tháng</span><span class="val canchi">${canChiMonth}</span>
            <span class="lbl">Can Chi Năm</span><span class="val canchi">${canChiYear}</span>
            <span class="lbl">Tiết khí (nếu rơi đúng ngày)</span>
            <span class="val ${tietKhiExact ? 'tietKhi-val' : ''}">${tietKhiExact || '— không có'}</span>
        </div>

        <div class="detail-section-label tiet">☀️ Lịch Tiết Khí (Nguyệt Lệnh thật, tính lúc 12:00 trưa)</div>
        ${tietBlock}
        ${transitionBlock}

        ${nguLinhBlock}
    `;
    document.getElementById('dayModal').classList.add('active');
}

// =========================================================
//  IMPORTANT DAYS
// =========================================================
const importantDaysDB = {
    2025: {
        1:  ["01/01: Tết Dương Lịch"],
        2:  ["29/01: Giao thừa Ất Tỵ","01/02: Mùng 1 Tết Nguyên Đán","05/02: Mùng 5 (Khai hạ)"],
        3:  [],
        4:  ["07/04: Giỗ Tổ Hùng Vương (âm 10/3)","30/04: Ngày Giải phóng"],
        5:  ["01/05: Ngày Quốc tế Lao động","19/05: Sinh nhật Bác Hồ"],
        6:  [],
        7:  ["27/07: Ngày Thương binh Liệt sĩ"],
        8:  [],
        9:  ["02/09: Quốc khánh Việt Nam"],
        10: [],
        11: [],
        12: ["22/12: Ngày Quân đội Nhân dân","25/12: Giáng sinh"]
    }
};
async function fetchImportantDays(year, month) { return (importantDaysDB[year] && importantDaysDB[year][month]) || []; }
async function displayImportantDays(year, month) {
    const listEl = document.getElementById('importantDaysList');
    const days = await fetchImportantDays(year, month);
    if (days.length === 0) { listEl.innerHTML = '<p class="empty-note">Không có ngày quan trọng trong tháng này.</p>'; return; }
    listEl.innerHTML = '<ul class="info-list">' + days.map(d => `<li><span class="dot dot-gold"></span>${d}</li>`).join('') + '</ul>';
}

// =========================================================
//  THIÊN XÁ
// =========================================================
function getSeason(lunarMonth) {
    if ([1,2,3].includes(lunarMonth)) return 'Xuân';
    if ([4,5,6].includes(lunarMonth)) return 'Hạ';
    if ([7,8,9].includes(lunarMonth)) return 'Thu';
    if ([10,11,12].includes(lunarMonth)) return 'Đông';
    return null;
}
function isThienXaDay(canChiDay, season) {
    const rules = { Xuân:'Mậu Dần', Hạ:'Giáp Ngọ', Thu:'Mậu Thân', Đông:'Giáp Tý' };
    return canChiDay === rules[season];
}
function findThienXaDays(year, month) {
    const days = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    const pad = n => String(n).padStart(2,'0');
    for (let d = 1; d <= daysInMonth; d++) {
        try {
            const sd = new LunarDateLib.SolarDate({ day:d, month, year });
            const ld = sd.toLunarDate();
            ld.init();
            const season = getSeason(ld.month);
            const cc = ld.getDayName();
            if (season && isThienXaDay(cc, season)) {
                days.push({ solar:`${pad(d)}/${pad(month)}/${year}`, lunar:`${pad(ld.day)}/${pad(ld.month)}${ld.leap ? ' nhuận' : ''}`, canChi: cc, season });
            }
        } catch(e) {}
    }
    return days;
}
function displayThienXaDays(year, month) {
    const el = document.getElementById('thienXaDaysList');
    const txDays = findThienXaDays(year, month);
    if (txDays.length === 0) { el.innerHTML = '<p class="empty-note">Không có ngày Thiên Xá trong tháng này.</p>'; return; }
    el.innerHTML = txDays.map(tx => `
        <div class="thienxa-item">
            <div class="tx-date">✨ ${tx.solar} — ${tx.season}</div>
            <div class="tx-detail">Âm: ${tx.lunar} · Can Chi: ${tx.canChi}</div>
        </div>`).join('');
}

// =========================================================
//  TÍNH SỐ NGÀY / TÌM THỜI ĐIỂM
// =========================================================
function calculateDate() {
    const day = parseInt(document.getElementById('startDay').value);
    const mon = parseInt(document.getElementById('startMonth').value);
    const yr  = parseInt(document.getElementById('startYear').value);
    const n   = parseInt(document.getElementById('numDays').value);
    const res = document.getElementById('calcResult');
    if ([day,mon,yr,n].some(isNaN)) { res.className='calc-result err'; res.innerHTML='Vui lòng nhập đầy đủ thông tin hợp lệ.'; return; }
    const start = new Date(yr, mon-1, day);
    const result = new Date(start.getTime() + n * 86400000);
    const pad = x => String(x).padStart(2,'0');
    const fmtIn = `${pad(day)}.${pad(mon)}.${yr}`;
    const fmtOut = `${pad(result.getDate())}.${pad(result.getMonth()+1)}.${result.getFullYear()}`;
    const dir = n >= 0 ? `đếm tới ${Math.abs(n)} ngày` : `đếm lùi ${Math.abs(n)} ngày`;
    res.className = 'calc-result ok';
    res.innerHTML = `Từ <span class="highlight-date">${fmtIn}</span> ${dir} → <span class="highlight-date">${fmtOut}</span>`;
}
function calculateDaysBetween() {
    const d1=parseInt(document.getElementById('date1Day').value), m1=parseInt(document.getElementById('date1Month').value), y1=parseInt(document.getElementById('date1Year').value);
    const d2=parseInt(document.getElementById('date2Day').value), m2=parseInt(document.getElementById('date2Month').value), y2=parseInt(document.getElementById('date2Year').value);
    const res = document.getElementById('findResult');
    if ([d1,m1,y1,d2,m2,y2].some(isNaN)) { res.className='calc-result err'; res.innerHTML='Vui lòng nhập đầy đủ thông tin hợp lệ.'; return; }
    const pad = x => String(x).padStart(2,'0');
    const date1 = new Date(y1,m1-1,d1), date2 = new Date(y2,m2-1,d2);
    const diff = Math.floor(Math.abs(date2-date1)/86400000);
    res.className = 'calc-result ok';
    res.innerHTML = `Giữa <span class="highlight-date">${pad(d1)}.${pad(m1)}.${y1}</span> và <span class="highlight-date">${pad(d2)}.${pad(m2)}.${y2}</span> là <strong>${diff}</strong> ngày.`;
}

// =========================================================
//  TRA CỨU TIẾT KHÍ THEO NĂM (nút "tham khảo")
// =========================================================
function openTietKhiYearModal(presetYear) {
    openModal('tietKhiYearModal');
    const input = document.getElementById('tkYearInput');
    input.value = presetYear || currentRealYear();
    renderTietKhiYear();
}
function renderTietKhiYear() {
    const year = parseInt(document.getElementById('tkYearInput').value);
    const content = document.getElementById('tkYearContent');
    if (isNaN(year)) { content.innerHTML = '<p class="tietKhi-unavail">Nhập năm hợp lệ.</p>'; return; }
    if (!solarTermsDB[year]) {
        content.innerHTML = `<p class="tietKhi-unavail">Chưa có dữ liệu Tiết Khí cho năm ${year}. Dữ liệu có sẵn: 2023–2046.</p>`;
        return;
    }
    const seasons = [
        { label:'Mùa Xuân (Th.1–3)', months:[1,2,3] },
        { label:'Mùa Hạ (Th.4–6)',   months:[4,5,6] },
        { label:'Mùa Thu (Th.7–9)',  months:[7,8,9] },
        { label:'Mùa Đông (Th.10–12)', months:[10,11,12] }
    ];
    const pad = n => String(n).padStart(2,'0');
    let html = `<div class="detail-section-label tiet" style="margin-top:4px">Tiết Khí năm ${year}</div>`;
    seasons.forEach(s => {
        const items = [];
        s.months.forEach(m => {
            (solarTermsDB[year][m] || []).forEach(t => {
                items.push(`<li><span class="yr-name">${t.name}</span><span class="yr-time">${pad(t.day)}/${pad(m)}/${year} — ${t.time}</span></li>`);
            });
        });
        if (items.length) {
            html += `<div class="year-ref-season"><h5>${s.label}</h5><ul class="year-ref-list">${items.join('')}</ul></div>`;
        }
    });
    content.innerHTML = html;
}

// =========================================================
//  NL_* — CẦU NỐI DỮ LIỆU CHO NGŨ LINH ENGINE
//  (Các file thuật toán KHÔNG gọi trực tiếp các hàm này; chúng chỉ
//   nhận dữ liệu qua "ctx" do ngulinh-engine.js truyền vào run(ctx).
//   Các hàm dưới đây chỉ được ngulinh-engine.js sử dụng.)
// =========================================================

// 12 khung giờ Chi truyền thống + khoảng giờ dương lịch tương ứng
const NL_GIO_LIST = [
    { chi:'Tý',   label:'23:00–00:59' },
    { chi:'Sửu',  label:'01:00–02:59' },
    { chi:'Dần',  label:'03:00–04:59' },
    { chi:'Mão',  label:'05:00–06:59' },
    { chi:'Thìn', label:'07:00–08:59' },
    { chi:'Tỵ',   label:'09:00–10:59' },
    { chi:'Ngọ',  label:'11:00–12:59' },
    { chi:'Mùi',  label:'13:00–14:59' },
    { chi:'Thân', label:'15:00–16:59' },
    { chi:'Dậu',  label:'17:00–18:59' },
    { chi:'Tuất', label:'19:00–20:59' },
    { chi:'Hợi',  label:'21:00–22:59' }
];
const NL_GIO_START_HOUR = { 'Tý':23,'Sửu':1,'Dần':3,'Mão':5,'Thìn':7,'Tỵ':9,'Ngọ':11,'Mùi':13,'Thân':15,'Dậu':17,'Tuất':19,'Hợi':21 };

function NL_renderGioSelectHtml() {
    const opts = NL_GIO_LIST.map(g => `<option value="${g.chi}">${g.chi} (${g.label})</option>`).join('');
    return `<option value="">-- Chọn giờ --</option>` + opts;
}

// Ngũ Thử Độn: Can của giờ Tý theo Can của Ngày
function stemOfTyFromDayCan(dayCanIdx) {
    return (2 * (dayCanIdx % 5)) % 10;
}

function NL_getGioCanChi(canChiNgayText, chi) {
    if (!canChiNgayText || !chi) return null;
    const dayCan = canChiNgayText.split(' ')[0];
    const dayCanIdx = THIEN_CAN.indexOf(dayCan);
    if (dayCanIdx === -1) return null;
    const stemTy = stemOfTyFromDayCan(dayCanIdx);
    const offset = DIA_CHI_CHUAN.indexOf(chi); // DIA_CHI_CHUAN bắt đầu từ Tý = 0
    if (offset === -1) return null;
    const canIdx = (stemTy + offset) % 10;
    return THIEN_CAN[canIdx] + ' ' + chi;
}

/**
 * Dựng đối tượng ngữ cảnh (ctx) đầy đủ cho 1 thời điểm Ngày+Giờ, để truyền
 * cho các thuật toán Ngũ Linh (xem cấu trúc ctx trong ngulinh-engine.js).
 */
function NL_getDayContext(year, month, day, chi) {
    const weekdays = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
    const thu = weekdays[new Date(year, month-1, day).getDay()];
    const soc = getSocVongInfo(year, month, day);

    // Dùng giữa khung giờ được chọn để tra Tiết Khí (đủ chính xác cho việc
    // xác định tháng/năm Tiết Khí; sai số chỉ đáng kể nếu đúng thời điểm
    // giao Tiết rơi vào giữa khung giờ đó).
    const startHour = chi ? (NL_GIO_START_HOUR[chi] ?? 12) : 12;
    const probeHour = (startHour + 1) % 24;
    const tietObj = getTietKhiThangNam(ictInstant(year, month, day, probeHour, 0));

    const canChiNgay = soc ? soc.ngayCC : null;
    const gio = chi ? {
        chi: chi,
        canChi: NL_getGioCanChi(canChiNgay, chi),
        khoangGio: (NL_GIO_LIST.find(g => g.chi === chi) || {}).label || ''
    } : null;

    return {
        duong: { ngay: day, thang: month, nam: year, thu: thu },
        socVong: soc ? {
            amLich: soc.lunarDay,
            canChiNgay: soc.ngayCC,
            canChiThang: soc.thangCC,
            canChiNam: soc.namCC
        } : null,
        tietKhi: tietObj ? {
            tietHienHanh: tietObj.tietHienHanh,
            canChiThang: tietObj.thangCanChi.text,
            canChiNam: tietObj.namCanChi.text
        } : null,
        gio: gio
    };
}

// =========================================================
//  INIT
// =========================================================
(function init() {
    const now = new Date();
    })();

