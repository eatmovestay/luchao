/**
 * ============================================================================
 * MODULE R.2.2 — THANG ĐO NĂNG LƯỢNG HÀO (Nhật - Nguyệt - Thái Tuế)
 * ============================================================================
 * Input : 1 hào (Ngũ Hành + Địa Chi) + Tứ Trị + bối cảnh quẻ (hào động khác,
 *         Họ Quẻ, Hào Biến của chính hào, hào biến khác rảnh rỗi, Gần/Xa...)
 * Output: KHÔNG ép về 1 kết luận duy nhất. Trả về:
 *   - quan hệ thô với Nhật/Nguyệt/Tuế/Thời (sinh/khắc/xung/hợp/hình/hại/phá)
 *   - trạng thái mùa (Vượng/Tướng/Hưu/Tù/Tử)
 *   - trạng thái Trường Sinh (nếu rơi mốc)
 *   - cấp độ NỀN theo thang 5 cấp (Vượng/Hưu/Suy/Vô Căn/Quá Vượng)
 *   - danh sách TẤT CẢ case (C-MR.1→8) có thể áp dụng được, kèm điều kiện
 *   - tầng phân tích Thái Tuế riêng (không gộp vào thang 5 cấp)
 *   - 1 mục "de_xuat" là gợi ý ưu tiên của module (không phải kết luận ép buộc)
 *
 * Nguyên tắc bao trùm: Nguyên Tắc 2 — Hào KHÔNG được Sinh/Khắc/Xung/Hợp/Hình/
 * Hại/Phá ngược lên Tứ Trị. Mọi tương tác chiều Hào → Tứ Trị đều VÔ HIỆU,
 * chỉ chiều Tứ Trị → Hào mới có giá trị (trừ Lục Hợp/Tam Hợp, được phép cả 2
 * chiều vì bản chất Hợp không phải là công kích).
 * ============================================================================
 */

/* GHI CHÚ TÍCH HỢP (so với bản code thô gốc):
 * 1) SỬA CHÍNH TẢ: toàn bộ "Tị" -> "Tỵ" cho khớp quy ước code nền/m01/m04
 *    (cùng loại lỗi Hỏa/Hoả đã gặp trước đây — "Tị" là biến thể dấu khác,
 *    so khớp chuỗi với data thật dùng "Tỵ" sẽ bị trật).
 * 2) viTriTruongSinh() giờ ưu tiên gọi getTruongSinh() của code nền (đầy đủ
 *    12 mốc, đã kiểm chứng, dùng chung với mọi module khác) thay vì chỉ tra
 *    4 mốc nội bộ — bảng 4 mốc nội bộ (TRUONG_SINH_MOC) được ĐỐI CHIẾU khớp
 *    100% với bảng của code nền nên giữ lại làm fallback an toàn khi chạy
 *    độc lập không có total.html (vd unit test ngoài trình duyệt).
 * 3) tinhTuanKhong()/chiLamTuanKhong() giữ nguyên (không đổi) để module này
 *    vẫn dùng độc lập được, nhưng lớp ghép nối UI bên dưới ưu tiên ĐỌC THẲNG
 *    2 Địa Chi Tuần Không mà user đã xác nhận ở m01.js (không tự tính lại)
 *    — tránh 2 nơi tự tính ra 2 kết quả Tuần Không khác nhau trong cùng 1 quẻ.
 * Toàn bộ logic phân loại (classifyBase, C-MR.1->8, phanTichTue, analyzeHao,
 * xetTheDung) giữ NGUYÊN như bản gốc — không đổi.
 */
var __LucHaoR22 = (function () {
  'use strict';

  // ----------------------------------------------------------------------
  // 1. DỮ LIỆU NỀN: 12 ĐỊA CHI, NGŨ HÀNH, CAN
  // ----------------------------------------------------------------------
  const DIA_CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  const THIEN_CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];

  const NGU_HANH = {
    'Tý': 'Thủy', 'Hợi': 'Thủy',
    'Dần': 'Mộc', 'Mão': 'Mộc',
    'Tỵ': 'Hỏa', 'Ngọ': 'Hỏa',
    'Sửu': 'Thổ', 'Thìn': 'Thổ', 'Mùi': 'Thổ', 'Tuất': 'Thổ',
    'Thân': 'Kim', 'Dậu': 'Kim'
  };

  const EARTH_CHIS = ['Sửu', 'Thìn', 'Mùi', 'Tuất']; // 4 hào Thổ

  // Ngũ hành tương sinh: key sinh ra value
  const SINH_CHAIN = { 'Thủy': 'Mộc', 'Mộc': 'Hỏa', 'Hỏa': 'Thổ', 'Thổ': 'Kim', 'Kim': 'Thủy' };
  // Ngũ hành tương khắc: key khắc value
  const KHAC_CHAIN = { 'Thủy': 'Hỏa', 'Hỏa': 'Kim', 'Kim': 'Mộc', 'Mộc': 'Thổ', 'Thổ': 'Thủy' };

  const LUC_XUNG_PAIRS = [
    ['Tý', 'Ngọ'], ['Sửu', 'Mùi'], ['Dần', 'Thân'],
    ['Mão', 'Dậu'], ['Thìn', 'Tuất'], ['Tỵ', 'Hợi']
  ];

  const LUC_HOP_PAIRS = {
    'Tý': 'Sửu', 'Sửu': 'Tý',
    'Dần': 'Hợi', 'Hợi': 'Dần',
    'Mão': 'Tuất', 'Tuất': 'Mão',
    'Thìn': 'Dậu', 'Dậu': 'Thìn',
    'Tỵ': 'Thân', 'Thân': 'Tỵ',
    'Ngọ': 'Mùi', 'Mùi': 'Ngọ'
  };

  const TAM_HOP_CUC = [
    { chis: ['Thân', 'Tý', 'Thìn'], hanh: 'Thủy' },
    { chis: ['Hợi', 'Mão', 'Mùi'], hanh: 'Mộc' },
    { chis: ['Dần', 'Ngọ', 'Tuất'], hanh: 'Hỏa' },
    { chis: ['Tỵ', 'Dậu', 'Sửu'], hanh: 'Kim' }
  ];

  const LUC_HAI_PAIRS = {
    'Tý': 'Mùi', 'Mùi': 'Tý', 'Sửu': 'Ngọ', 'Ngọ': 'Sửu',
    'Dần': 'Tỵ', 'Tỵ': 'Dần', 'Mão': 'Thìn', 'Thìn': 'Mão',
    'Thân': 'Hợi', 'Hợi': 'Thân', 'Dậu': 'Tuất', 'Tuất': 'Dậu'
  };

  const LUC_PHA_PAIRS = {
    'Tý': 'Dậu', 'Dậu': 'Tý', 'Sửu': 'Thìn', 'Thìn': 'Sửu',
    'Dần': 'Hợi', 'Hợi': 'Dần', 'Mão': 'Ngọ', 'Ngọ': 'Mão',
    'Tỵ': 'Thân', 'Thân': 'Tỵ', 'Mùi': 'Tuất', 'Tuất': 'Mùi'
  };

  const HINH_MAP = {
    'Tý': ['Mão'], 'Mão': ['Tý'],
    'Dần': ['Tỵ'], 'Tỵ': ['Thân'], 'Thân': ['Dần'],
    'Sửu': ['Tuất'], 'Tuất': ['Mùi'], 'Mùi': ['Sửu'],
    'Thìn': ['Thìn'], 'Ngọ': ['Ngọ'], 'Dậu': ['Dậu'], 'Hợi': ['Hợi']
  };
  const TAM_HINH_SETS = [
    { chis: ['Sửu', 'Mùi', 'Tuất'], ten: 'Tam Hình Thổ' },
    { chis: ['Dần', 'Tỵ', 'Thân'], ten: 'Tam Hình Vô Ân' }
  ];

  const TRUONG_SINH_MOC = {
    'Kim': { truongSinh: 'Tỵ', deVuong: 'Dậu', mo: 'Sửu', tuyet: 'Dần' },
    'Mộc': { truongSinh: 'Hợi', deVuong: 'Mão', mo: 'Mùi', tuyet: 'Thân' },
    'Thủy': { truongSinh: 'Thân', deVuong: 'Tý', mo: 'Thìn', tuyet: 'Tỵ' },
    'Hỏa': { truongSinh: 'Dần', deVuong: 'Ngọ', mo: 'Tuất', tuyet: 'Hợi' },
    'Thổ': { truongSinh: 'Thân', deVuong: 'Tý', mo: 'Thìn', tuyet: 'Tỵ' } // Thổ tùng Thủy
  };

  const NOI_TAI_MO_KHO = { 'Thìn': 'Thủy', 'Tuất': 'Hỏa/Thổ', 'Sửu': 'Kim', 'Mùi': 'Mộc' };

  const MUA_BY_NGUYET = {
    'Dần': 'Xuân', 'Mão': 'Xuân',
    'Tỵ': 'Hạ', 'Ngọ': 'Hạ',
    'Thân': 'Thu', 'Dậu': 'Thu',
    'Tý': 'Đông', 'Hợi': 'Đông',
    'Sửu': 'Tứ Quý', 'Thìn': 'Tứ Quý', 'Mùi': 'Tứ Quý', 'Tuất': 'Tứ Quý'
  };

  const VUONG_SUY_BANG = {
    'Xuân': { 'Mộc': 'Vượng', 'Hỏa': 'Tướng', 'Thủy': 'Hưu', 'Kim': 'Tù', 'Thổ': 'Tử' },
    'Hạ': { 'Hỏa': 'Vượng', 'Thổ': 'Tướng', 'Mộc': 'Hưu', 'Thủy': 'Tù', 'Kim': 'Tử' },
    'Thu': { 'Kim': 'Vượng', 'Thủy': 'Tướng', 'Hỏa': 'Hưu', 'Mộc': 'Tù', 'Thổ': 'Tử' },
    'Đông': { 'Thủy': 'Vượng', 'Mộc': 'Tướng', 'Kim': 'Hưu', 'Thổ': 'Tù', 'Hỏa': 'Tử' },
    'Tứ Quý': { 'Thổ': 'Vượng', 'Kim': 'Tướng', 'Hỏa': 'Hưu', 'Mộc': 'Tù', 'Thủy': 'Tử' }
  };

  function nguHanh(chi) { return NGU_HANH[chi]; }
  function laSinh(hanhA, hanhB) { return SINH_CHAIN[hanhA] === hanhB; }
  function laKhac(hanhA, hanhB) { return KHAC_CHAIN[hanhA] === hanhB; }

  function getXung(chiA, chiB) {
    const isPair = LUC_XUNG_PAIRS.some(p => (p[0] === chiA && p[1] === chiB) || (p[0] === chiB && p[1] === chiA));
    if (!isPair) return { xung: false, khacKem: false, chieuKhac: null };
    const hA = nguHanh(chiA), hB = nguHanh(chiB);
    if (hA === 'Thổ' && hB === 'Thổ') {
      return { xung: true, khacKem: false, chieuKhac: null, ghiChu: 'Thổ vượng lên, xung tán tích lũy hoặc mở Mộ Khố (Thìn-Tuất)' };
    }
    if (laKhac(hA, hB)) return { xung: true, khacKem: true, chieuKhac: 'AtoB' };
    if (laKhac(hB, hA)) return { xung: true, khacKem: true, chieuKhac: 'BtoA' };
    return { xung: true, khacKem: false, chieuKhac: null };
  }

  function laLucHop(chiA, chiB) { return LUC_HOP_PAIRS[chiA] === chiB; }

  function timTamHopCuc(danhSachChi) {
    for (const cuc of TAM_HOP_CUC) {
      if (cuc.chis.every(c => danhSachChi.includes(c))) return cuc;
    }
    return null;
  }

  function laLucHai(chiA, chiB) { return LUC_HAI_PAIRS[chiA] === chiB; }
  function laLucPha(chiA, chiB) { return LUC_PHA_PAIRS[chiA] === chiB; }

  function laHinh(chiA, chiB) {
    const list = HINH_MAP[chiA] || [];
    return list.includes(chiB);
  }

  function timTamHinh(danhSachChi) {
    const ketQua = [];
    for (const th of TAM_HINH_SETS) {
      if (th.chis.every(c => danhSachChi.includes(c))) ketQua.push(th.ten);
    }
    return ketQua;
  }

  function coKhiThoChung(chiA, chiB) {
    return EARTH_CHIS.includes(chiA) && EARTH_CHIS.includes(chiB);
  }

  function mua(nguyetLenh) { return MUA_BY_NGUYET[nguyetLenh]; }

  function vuongSuyTheoMua(hanh, nguyetLenh) {
    const m = mua(nguyetLenh);
    return VUONG_SUY_BANG[m] ? VUONG_SUY_BANG[m][hanh] : null;
  }

  function viTriTruongSinh(hanh, chiMoc, chiHaoGoc) {
    if (chiHaoGoc && typeof getTruongSinh === "function") {
      try {
        const tenMoc = getTruongSinh(chiHaoGoc, chiMoc);
        if (tenMoc) return [tenMoc];
      } catch (e) { /* rơi xuống bảng nội bộ */ }
    }
    const moc = TRUONG_SINH_MOC[hanh];
    if (!moc) return [];
    const nhan = [];
    if (moc.truongSinh === chiMoc) nhan.push('Trường Sinh');
    if (moc.deVuong === chiMoc) nhan.push('Đế Vượng');
    if (moc.mo === chiMoc) nhan.push('Mộ');
    if (moc.tuyet === chiMoc) nhan.push('Tuyệt');
    return nhan;
  }

  function tinhTuanKhong(canIdx, chiIdx) {
    const chiCuaGiap = ((chiIdx - canIdx) % 12 + 12) % 12;
    const khong1 = (chiCuaGiap + 10) % 12;
    const khong2 = (chiCuaGiap + 11) % 12;
    return [DIA_CHI[khong1], DIA_CHI[khong2]];
  }

  function chiLamTuanKhong(canChiNgay) {
    const canIdx = THIEN_CAN.indexOf(canChiNgay.can);
    const chiIdx = DIA_CHI.indexOf(canChiNgay.chi);
    if (canIdx < 0 || chiIdx < 0) return null;
    return tinhTuanKhong(canIdx, chiIdx);
  }

  function quanHeVoiMoc(hanhHao, chiHao, chiMoc, tenMoc) {
    const hanhMoc = nguHanh(chiMoc);
    const ketQua = { moc: tenMoc, chiMoc, hanhMoc, tags: [] };

    if (chiHao === chiMoc) {
      ketQua.tags.push(`Trực ${tenMoc} (trùng Địa Chi)`);
    } else if (hanhHao === hanhMoc) {
      ketQua.tags.push(`Lâm ${tenMoc} (cùng Ngũ Hành, khác Địa Chi)`);
    }

    if (laSinh(hanhMoc, hanhHao)) ketQua.tags.push(`Được ${tenMoc} Sinh`);
    if (laKhac(hanhMoc, hanhHao)) ketQua.tags.push(`Bị ${tenMoc} Khắc`);
    if (laSinh(hanhHao, hanhMoc)) ketQua.tags.push(`(Hào sinh ngược ${tenMoc} — vô hiệu theo Nguyên Tắc 2)`);
    if (laKhac(hanhHao, hanhMoc)) ketQua.tags.push(`(Hào khắc ngược ${tenMoc} — vô hiệu theo Nguyên Tắc 2)`);

    const xungInfo = getXung(chiMoc, chiHao);
    if (xungInfo.xung) {
      let nhan = `Bị ${tenMoc} Xung`;
      if (xungInfo.khacKem) nhan += ' (vừa Xung vừa Khắc)';
      else nhan += ' (Xung không Khắc)';
      ketQua.tags.push(nhan);
      ketQua.xungInfo = xungInfo;
    }

    if (laLucHop(chiMoc, chiHao)) ketQua.tags.push(`Lục Hợp với ${tenMoc}`);

    if (laHinh(chiMoc, chiHao)) ketQua.tags.push(`Bị ${tenMoc} Hình`);
    if (laLucHai(chiMoc, chiHao)) ketQua.tags.push(`Bị ${tenMoc} Hại (Lục Hại)`);
    if (laLucPha(chiMoc, chiHao)) ketQua.tags.push(`Bị ${tenMoc} Phá (Lục Phá)`);

    const tsNhan = viTriTruongSinh(hanhHao, chiMoc, chiHao);
    if (tsNhan.length) ketQua.tags.push(`${tsNhan.join(' & ')} của hành ${hanhHao} tại ${tenMoc} (${chiMoc})`);

    return ketQua;
  }

  function classifyBase(qhNhat, qhNguyet, mucMua) {
    const nhatSinh = qhNhat.tags.some(t => t.startsWith('Được') && t.includes('Sinh'));
    const nhatKhac = qhNhat.tags.some(t => t.startsWith('Bị') && t.includes('Khắc'));
    const nhatLamTruc = qhNhat.tags.some(t => t.includes('Trực') || t.includes('Lâm'));
    const nguyetSinh = qhNguyet.tags.some(t => t.startsWith('Được') && t.includes('Sinh'));
    const nguyetKhac = qhNguyet.tags.some(t => t.startsWith('Bị') && t.includes('Khắc'));
    const nguyetLamTruc = qhNguyet.tags.some(t => t.includes('Trực') || t.includes('Lâm'));

    const coGocNhatNguyet = nhatSinh || nguyetSinh || nhatLamTruc || nguyetLamTruc;

    const capNen = {
      vuong: (nhatSinh || nhatLamTruc) && (nguyetSinh || nguyetLamTruc),
      hưu: !nhatSinh && !nhatKhac && !nguyetSinh && !nguyetKhac && !nhatLamTruc && !nguyetLamTruc,
      suy: (nhatKhac || nguyetKhac) && !coGocNhatNguyet,
      voCan: !coGocNhatNguyet && !nhatKhac && !nguyetKhac && mucMua === 'Tử',
      trai_chieu_nhat_nguyet: (nhatSinh || nhatLamTruc) && nguyetKhac || (nguyetSinh || nguyetLamTruc) && nhatKhac
    };

    let nhan = 'Chưa xác định — cần applyCMR để xử lý case trái chiều/Gần-Xa';
    if (capNen.trai_chieu_nhat_nguyet) nhan = 'TRÁI CHIỀU NHẬT-NGUYỆT (xem C-MR.4 / C-MR.7)';
    else if (capNen.vuong) nhan = 'VƯỢNG';
    else if (capNen.suy) nhan = 'SUY';
    else if (capNen.voCan) nhan = 'VÔ CĂN';
    else if (capNen.hưu) nhan = 'HƯU (dual-state, cần Gần/Xa)';

    return { nhan, chiTiet: capNen, nhatSinh, nhatKhac, nhatLamTruc, nguyetSinh, nguyetKhac, nguyetLamTruc };
  }

  function applyCMR(baseResult, context) {
    const ctx = context || {};
    const cases = [];

    if (baseResult.chiTiet.trai_chieu_nhat_nguyet) {
      const nguyetKhacNhatSinh = baseResult.nguyetKhac && (baseResult.nhatSinh || baseResult.nhatLamTruc);
      const nhatKhacNguyetSinh = baseResult.nhatKhac && (baseResult.nguyetSinh || baseResult.nguyetLamTruc);

      if (nguyetKhacNhatSinh) {
        cases.push({
          code: 'C-MR.4',
          dieuKien: 'Nguyệt Khắc dù Nhật Sinh/Lâm/Trực Nhật',
          ganKetLuan: 'SUY/HỎNG trong phạm vi tháng hiện tại (Nguyệt sinh sát trọn quyền tại Gần)',
          xaKetLuan: 'Có gốc thật (nhờ Nhật) — sang Nguyệt Lệnh khác, nếu cứu thần đắc thời (Vượng) thì lên Tướng/Vượng; nếu Xa mà vẫn không cứu thần nào thì áp C-MR.6 (Hỏng luôn)',
          apDung: ctx.ganXa || 'CHƯA RÕ — cần xác định Gần hay Xa trước khi chốt'
        });
      }
      if (nhatKhacNguyetSinh) {
        cases.push({
          code: 'C-MR.7',
          dieuKien: 'Nhật Khắc + Nguyệt Cứu (Sinh/Lâm/Trực Nguyệt)',
          ganKetLuan: 'ỔN trong tháng hiện tại (Nguyệt trọn quyền che được Nhật khắc)',
          xaKetLuan: 'Sang tháng khác: nếu tháng đó không còn ai cứu (Nguyệt mới không sinh) → Nhật khắc phát 100% (hằng số dai dẳng). Cần xét tiếp cứu tinh khác (hào động/biến/họ quẻ) có lực không, tại đúng tháng đó Vượng hay Vô Lực mới kết luận Hỏng hay còn đường thoát.',
          apDung: ctx.ganXa || 'CHƯA RÕ — cần xác định Gần hay Xa trước khi chốt'
        });
      }
    }

    if ((baseResult.nhan === 'SUY' || baseResult.chiTiet.suy) && ctx.ganXa === 'xa' && ctx.coCuuThanNaoKhac === false) {
      cases.push({
        code: 'C-MR.6',
        dieuKien: 'Xét XA, hào Suy, KHÔNG có bất kỳ cứu thần nào (Nhật/hào động/hào biến/họ quẻ)',
        ketLuan: 'HỎNG NGAY từ hiện tại, không chờ qua tháng — không có gì để đợi.'
      });
    }

    if (baseResult.nhan === 'SUY' && ctx.qbHoiDauSinh) {
      cases.push({
        code: 'C-MR.1',
        dieuKien: 'Hào Suy được Hào Biến (QB) của chính nó Hồi Đầu Sinh',
        ganKetLuan: 'Trên mức Hưu Tù (tạm yếu nhưng có cứu)',
        xaKetLuan: ctx.qbHoiDauSinhVuongLucTaiThoiDiemXa
          ? 'Có thể lên Vượng/Tướng vì QB đó đang/sẽ đến thời vượng'
          : 'Chỉ lên Vượng/Tướng KHI đến đúng thời điểm QB đó vượng — cần biết mùa/tháng QB vượng là khi nào'
      });
    }

    if (ctx.haoDongKhacSinh) {
      cases.push({
        code: 'C-MR.2',
        dieuKien: 'Có Hào Động khác trong quẻ (không phải QB hồi đầu) cũng sinh Ngũ Hành cho hào này',
        ketLuan: 'Cộng thêm lực — không có trần cứng, mức trần tùy thời điểm cứu thần đắc lệnh (Vượng).'
      });
    }

    if (ctx.haoBienKhacDongSinh && ctx.haoBienKhacDongSinh.coTuongTac) {
      cases.push({
        code: 'C-MR.3',
        dieuKien: 'Hào Biến của 1 hào động KHÁC (không phải QB của chính hào đang xét) động sinh cho hào này',
        dieuKienTuDo: ctx.haoBienKhacDongSinh.tuDo
          ? 'ĐỦ điều kiện tự do (không Tứ Trị khống chế nặng, Hưu Tù+, không Hợp, không Hình/Hại nặng bởi Tứ Trị, không bị hào biến khác mạnh hơn áp chế)'
          : 'CHƯA đủ điều kiện tự do — cần kiểm tra lại 5 điều kiện trước khi áp dụng case này',
        ketLuan: ctx.haoBienKhacDongSinh.tuDo
          ? 'Hào Suy/Tĩnh/Động/Ám Động này được nâng lên mức Hưu Tù trở lên (có lực). Lưu ý: đây là ngoại lệ override Nguyên Tắc 3 gốc.'
          : 'Không áp dụng được case này cho đến khi xác nhận đủ điều kiện tự do.'
      });
    }

    if (ctx.hoQueSinh) {
      cases.push({
        code: 'C-MR.5',
        dieuKien: 'Được sinh Ngũ Hành bởi Họ Quẻ (Cung Quái) của Quẻ Chính',
        ketLuan: 'Cộng thêm điểm lực, gộp vào tổng lực cộng dồn cùng các case khác.'
      });
    }

    if (ctx.nhatXungCungHanhVoiNhat && ctx.khongBiKhacThuongNoiBo) {
      cases.push({
        code: 'C-MR.8 (ĐỀ XUẤT — chưa chính thức)',
        dieuKien: 'Nhật Xung + hào cùng Ngũ Hành với Nhật (case mở rộng Lâm Nhật) + không bị khắc thương + đủ lực trên Hưu Tù',
        ketLuan: 'Có xu hướng thành Ám Động (không phải Nhật Phá) — CẦN xác nhận thêm để chính thức hóa, không dùng làm căn cứ chắc chắn.'
      });
    }

    return cases;
  }

  function phanTichTue(hanhHao, chiHao, chiTue) {
    const qh = quanHeVoiMoc(hanhHao, chiHao, chiTue, 'Thái Tuế');
    const tot = qh.tags.some(t => t.includes('Sinh') || t.includes('Hợp') || t.includes('Trực'));
    const xau = qh.tags.some(t => t.includes('Khắc') || t.includes('Xung') || t.includes('Hình') || t.includes('Hại') || t.includes('Phá'));

    let dienGiai = '';
    if (tot && !xau) {
      dienGiai = 'Quan hệ TỐT với Tuế (Sinh/Hợp/Trực Tuế) = chỉ dấu điều kiện thượng tầng thuận lợi ("phúc"), KHÔNG đảm bảo phát mạnh. Vẫn phải xét quan hệ với Nhật/Nguyệt (và Thời nếu hỏi việc trong ngày) + tương tác nội bộ quẻ mới đo được thành/bại tổng cuộc. Tuế Sinh KHÔNG miễn nhiễm rủi ro — nếu Nhật/Nguyệt/hào khác đánh xấu thì hậu quả vẫn có thật, chỉ giảm bớt một phần.';
    } else if (xau && !tot) {
      dienGiai = 'Quan hệ XẤU với Tuế (Khắc/Xung/Phá/Hình/Hại) = chỉ dấu thiếu điều kiện thuận lợi thượng tầng, thậm chí bất lợi — nhưng CHƯA tự kết luận hỏng. Bắt buộc xét tiếp Nhật/Nguyệt/nội bộ quẻ. Nếu đồng thời hào này cũng bị áp chế bởi Nhật/Nguyệt/hào trong quẻ → hoàn cảnh khó khăn/tổn thất/mất cơ hội là thật, NHƯNG nội lực không bị bào mòn, không sụp đổ hẳn (tai ương phải chịu nhưng không mất gốc). Nếu KHÔNG bị áp chế gì thêm → nội lực căn cơ vẫn vững.';
    } else if (tot && xau) {
      dienGiai = 'Tuế vừa có yếu tố tốt vừa có yếu tố xấu cùng lúc (ví dụ vừa Lâm vừa bị 1 quan hệ khác) — cần xem kỹ từng tag riêng lẻ ở qh.tags để phân định.';
    } else {
      dienGiai = 'Không có quan hệ đặc biệt với Thái Tuế — Tuế trung tính đối với hào này, không cộng/trừ điểm thượng tầng.';
    }

    return { quanHeTho: qh, tot, xau, dienGiai };
  }

  function analyzeHao(input) {
    const { hao, tuTru, context } = input;
    const hanhHao = hao.hanh, chiHao = hao.chi;

    const qhNhat = quanHeVoiMoc(hanhHao, chiHao, tuTru.nhat, 'Nhật Thần');
    const qhNguyet = quanHeVoiMoc(hanhHao, chiHao, tuTru.nguyet, 'Nguyệt Lệnh');
    const qhThoi = tuTru.thoi ? quanHeVoiMoc(hanhHao, chiHao, tuTru.thoi, 'Thời Thần') : null;

    const mucMua = vuongSuyTheoMua(hanhHao, tuTru.nguyet);
    const truongSinhTaiNhat = viTriTruongSinh(hanhHao, tuTru.nhat, chiHao);
    const truongSinhTaiNguyet = viTriTruongSinh(hanhHao, tuTru.nguyet, chiHao);

    const baseResult = classifyBase(qhNhat, qhNguyet, mucMua);
    const caseList = applyCMR(baseResult, context || {});
    const tueResult = phanTichTue(hanhHao, chiHao, tuTru.tue);

    let khiThoNote = null;
    if (EARTH_CHIS.includes(chiHao)) {
      const nhatCoKhiTho = EARTH_CHIS.includes(tuTru.nhat) && tuTru.nhat !== chiHao;
      const nguyetCoKhiTho = EARTH_CHIS.includes(tuTru.nguyet) && tuTru.nguyet !== chiHao;
      if (nhatCoKhiTho || nguyetCoKhiTho) {
        khiThoNote = 'Hào Thổ này chia sẻ "khí Thổ" với ' +
          [nhatCoKhiTho ? 'Nhật' : null, nguyetCoKhiTho ? 'Nguyệt' : null].filter(Boolean).join(' và ') +
          ' (dù có thể không Xung đúng cặp đối) — đây là quan hệ khí/năng lượng thuần túy, tách biệt khỏi Xung thật và khỏi Hình/Tam Hình. Chỉ tính là điểm cộng dự phòng, không bắt buộc phải luôn cộng nếu hào đã đủ mạnh từ nguồn khác.';
      }
    }

    let deXuat = [];
    if (caseList.length === 0) {
      deXuat.push(`Cấp nền: ${baseResult.nhan}. Không có case C-MR đặc biệt nào được kích hoạt theo context hiện tại — có thể do thiếu dữ liệu context (Gần/Xa, QB, hào động khác...), hoặc hào này thực sự chỉ cần đọc theo thang 5 cấp gốc.`);
    } else {
      deXuat.push(`Có ${caseList.length} case liên quan được liệt kê — nên đọc theo thứ tự: case xác định phạm vi thời gian (C-MR.4/7, Gần-Xa) trước, rồi mới đến các case cộng lực (C-MR.1/2/3/5), vì phạm vi thời gian quyết định case cộng lực có "còn kịp" phát huy hay không.`);
    }
    if (tueResult.xau) {
      deXuat.push('Tuế đang bất lợi — nếu việc hỏi liên quan cấp cao/pháp lý/kéo dài nhiều năm, nên nhấn mạnh thêm dù Nhật/Nguyệt có ủng hộ.');
    }
    if (khiThoNote) deXuat.push('Có yếu tố Khí Thổ — cân nhắc như 1 lớp cộng lực dự phòng, không phải cấp độ chính.');

    return {
      hao: hao.ten || `${hanhHao}-${chiHao}`,
      quanHeThoTuTri: { nhat: qhNhat, nguyet: qhNguyet, thoi: qhThoi },
      muaVuongSuy: mucMua,
      truongSinh: { taiNhat: truongSinhTaiNhat, taiNguyet: truongSinhTaiNguyet },
      capNenThang5: baseResult,
      caseApDung: caseList,
      tangThaiTue: tueResult,
      khiThoNote,
      deXuat
    };
  }

  const THANG_MUC_DO = ['Tử/Vô Căn', 'Suy', 'Tù', 'Hưu', 'Tướng', 'Vượng', 'Đế Vượng'];

  function datNguongHuuTu(mucDo) {
    const idx = THANG_MUC_DO.indexOf(mucDo);
    const idxHuu = THANG_MUC_DO.indexOf('Hưu');
    return idx >= idxHuu;
  }

  function xetTheDung(ketQuaThe, ketQuaDung) {
    return {
      ghiChu: 'Quy tắc AND cứng: cả Thế lẫn Dụng Thần đều phải đạt Hưu Tù trở lên mới THÀNH. Một bên dưới ngưỡng là HỎNG dù bên kia tốt cỡ nào. Quan hệ với Tuế của Thế và Dụng phải xét ĐỘC LẬP nhau (không suy bên này ra bên kia).',
      the: ketQuaThe,
      dung: ketQuaDung,
      luuY: 'Hàm này chỉ nêu nguyên tắc — việc quy đổi "capNenThang5.nhan" của mỗi bên (Vượng/Hưu/Suy/Vô Căn/Quá Vượng) sang đúng vị trí trên THANG_MUC_DO cần đối chiếu thủ công với mùa + case C-MR đã áp dụng cho từng bên, vì cấp nền gốc chưa tự động phân giải Gần/Xa.'
    };
  }

  return {
    DIA_CHI, NGU_HANH, EARTH_CHIS,
    nguHanh, laSinh, laKhac, getXung, laLucHop, timTamHopCuc,
    laLucHai, laLucPha, laHinh, timTamHinh, coKhiThoChung,
    mua, vuongSuyTheoMua, viTriTruongSinh,
    tinhTuanKhong, chiLamTuanKhong,
    quanHeVoiMoc, classifyBase, applyCMR, phanTichTue, analyzeHao,
    xetTheDung, datNguongHuuTu, THANG_MUC_DO
  };
})();

if (typeof window !== 'undefined') { window.LucHaoR22 = __LucHaoR22; }
if (typeof module !== 'undefined' && module.exports) { module.exports = __LucHaoR22; }

/* ============================================================
   LỚP GHÉP NỐI VỚI CODE NỀN + m01.js + m02.js + m03.js + m04.js + UI (moduleSlot)
   ============================================================
   Đã nối: Tứ Trị + Quẻ Chính/Biến (code nền), Tuần Không (m01.js),
   Lục Thần + Tuần Không Phục Tàng (m02.js, qua window.M02_DATA), Case Mộ
   (m03.js, qua window.M03_DATA).
   Ghi chú tương thích (không tự sửa m02.js/m03.js):
   - m02.js có ô Nhật/Nguyệt riêng (#m02_Nhat/#m02_Nguyet, có nút Đồng Bộ
     copy 1 lần từ #mNhat/#mNguyet); m03.js đọc từ #tsNhat/#tsNguyet (box
     Trường Sinh & Vượng Suy). Nếu 3 nơi không khớp nhau, mỗi module có thể
     tính trên 1 Nhật/Nguyệt khác nhau — m05.js cảnh báo trong output nếu
     Tuần Không m01 và m02 lệch nhau.
   - Công thức Tuần Không m01 (hiệu Can-Chi) và m02 (60 Hoa Giáp + KV_PAIRS)
     cho cùng kết quả khi cùng 1 Nhật Thần — không phải bug.
   ============================================================ */
(function () {
    "use strict";

    function layDuLieuTuModule02() { return window.M02_DATA || null; }
    function layDuLieuTuModule03() { return window.M03_DATA || null; }

    function layChiTuTruong(id) {
        const el = document.getElementById(id);
        if (!el) return null;
        const parts = el.value.trim().split(/\s+/);
        return parts[1] || null;
    }
    function layTuTriTuCoreDOM() {
        return {
            thoi: layChiTuTruong("mThoi"),
            nhat: layChiTuTruong("mNhat"),
            nguyet: layChiTuTruong("mNguyet"),
            tue: layChiTuTruong("mThaiTue")
        };
    }
    function layTuanKhongChiTuM01() {
        if (window.TuanKhongModule) {
            const c1 = document.getElementById("m01_tkChi1");
            const c2 = document.getElementById("m01_tkChi2");
            return [c1 ? c1.value : "", c2 ? c2.value : ""].filter(Boolean);
        }
        return [];
    }
    function tachLucThan(napString) {
        const clean = napString.replace(/\(Thế\)|\(Ứng\)/g, "").trim();
        return clean.split(/\s+/).slice(0, -2).join(" ");
    }
    function layHaoListTuCoreDOM() {
        const cungEl = document.getElementById("selectCung");
        const queEl = document.getElementById("selectQue");
        if (!cungEl || !queEl || !cungEl.value || !queEl.value || typeof dataDich === "undefined") return null;
        const cungKeyChu = cungEl.value, qNameChu = queEl.value;
        const chuData = dataDich[cungKeyChu].quẻ[qNameChu];
        const cungChu = dataDich[cungKeyChu];
        const queBienData = (typeof bienQueGiam !== "undefined" && bienQueGiam) ? bienQueGiam.data : null;
        const dong = (typeof selectedDong !== "undefined") ? selectedDong : [];
        const thuongDong = dong.some(h => h >= 4);
        const haDong = dong.some(h => h <= 3);

        const haoList = [];
        for (let h = 1; h <= 6; h++) {
            const i = h - 1;
            const nap = chuData.n[i];
            const chiHanh = getChiHanh(nap);
            const chi = chiHanh.split(" ")[0];
            const lucThan = tachLucThan(nap);
            const theUng = nap.includes("(Thế)") ? "Thế" : (nap.includes("(Ứng)") ? "Ứng" : null);
            const isDong = dong.includes(h);

            let hb = null;
            if (isDong && queBienData) {
                const isHaoThuong = (h >= 4);
                const quaiCoDong = (isHaoThuong && thuongDong) || (!isHaoThuong && haDong);
                if (quaiCoDong) {
                    const chiHanhBien = getChiHanh(queBienData.n[i]);
                    const chiBien = chiHanhBien.split(" ")[0];
                    hb = { chi: chiBien, lucThan: tinhLucThan(getHanh(chiHanhBien), cungChu.hanh) };
                }
            }
            haoList.push({ soHao: h, chi, lucThan, theUng, isDong, hb });
        }
        return { haoList, cungHanh: cungChu.hanh };
    }

    function layDanhSachHaoDangBiMo(m03Data) {
        if (!m03Data || !Array.isArray(m03Data.danhSachHaoMo)) return [];
        return m03Data.danhSachHaoMo.map(x => x.hao);
    }

    function tuDoanContext(hao, haoList, cungHanh, haoDangBiMo) {
        const R = window.LucHaoR22;
        const hanhHao = R.nguHanh(hao.chi);
        const biMo = haoDangBiMo || [];

        const haoDongKhacSinh = haoList.some(h2 =>
            h2.soHao !== hao.soHao && h2.isDong && !biMo.includes(h2.soHao) &&
            R.laSinh(R.nguHanh(h2.chi), hanhHao)
        );

        let qbHoiDauSinh = false;
        if (hao.isDong && hao.hb && !biMo.includes(hao.soHao)) {
            qbHoiDauSinh = R.laSinh(R.nguHanh(hao.hb.chi), hanhHao);
        }

        const haoBienKhacSinhHao = haoList.find(h2 =>
            h2.soHao !== hao.soHao && h2.isDong && h2.hb && !biMo.includes(h2.soHao) &&
            R.laSinh(R.nguHanh(h2.hb.chi), hanhHao)
        );

        const hoQueSinh = cungHanh ? R.laSinh(cungHanh, hanhHao) : false;

        return {
            haoDongKhacSinh,
            qbHoiDauSinh,
            qbHoiDauSinhVuongLucTaiThoiDiemXa: false,
            haoBienKhacDongSinh: { coTuongTac: !!haoBienKhacSinhHao, tuDo: false },
            hoQueSinh,
            ganXa: null,
            coCuuThanNaoKhac: false,
            nhatXungCungHanhVoiNhat: false,
            khongBiKhacThuongNoiBo: false
        };
    }

    const boxHtml = `
        <div class="header" style="border-bottom: 1px solid var(--gold); padding: 5px 0 10px 0; margin-bottom: 15px;">
            <h1 style="font-size: 1.1rem;">Module 5 — Thang Đo Năng Lượng Hào (R2.2)</h1>
        </div>
        <p style="font-size:0.72rem;color:#888;margin:0 0 12px;">
            Bộ lọc Tinh cấp 2 — phân tích sâu hơn Module 4. Bấm "Trích Xuất" để tự lấy Tứ Trị +
            Quẻ Chính/Biến (code nền) + Tuần Không (Module 1); các cờ context còn lại (Gần/Xa,
            cứu thần, điều kiện "tự do"...) cần bạn xác nhận tay ở mỗi hào vì đây là phần đòi hỏi
            đọc câu hỏi cụ thể của lá quẻ, không thể tự suy từ dữ liệu quẻ không thôi.
        </p>
        <button class="m-btn-process" id="m05_trichXuatBtn">🔄 TRÍCH XUẤT DỮ LIỆU TỪ CODE NỀN + M01 + M04</button>
        <div id="m05_haoContainer"></div>
        <label style="margin-top:10px;">Chọn Hào Dụng Thần (tuỳ chọn — để chạy AND cứng Thế-Dụng)</label>
        <select id="m05_dungThanSo"><option value="">-- Không chọn --</option></select>
        <button class="m-btn-process" id="m05_chayBtn" style="display:none;">⚙️ CHẠY PHÂN TÍCH R2.2</button>
        <textarea id="m05_output" class="m-output-box" readonly></textarea>
        <button class="btn-copy" id="m05_copyBtn" style="display:none;">📋 SAO CHÉP KẾT QUẢ THANG ĐO NĂNG LƯỢNG</button>
        <div class="fallback-box" id="m05_fallbackBox">
            <textarea id="m05_fallbackText" readonly></textarea>
            <div class="fallback-hint">Trình duyệt chặn copy tự động — bấm vào ô trên để chọn hết rồi copy thủ công (Ctrl+C / giữ để copy)</div>
        </div>
    `;
    const box = moduleSlot(boxHtml);
    const $ = (id) => box.querySelector("#" + id);
    $("m05_output").addEventListener("click", function () { this.select(); });
    $("m05_fallbackText").addEventListener("click", function () { this.select(); });

    let duLieuHienTai = null;

    function trichXuat() {
        const tuTri = layTuTriTuCoreDOM();
        if (!tuTri.nhat || !tuTri.nguyet) {
            alert("Vui lòng nhập đủ Nhật Thần và Nguyệt Lệnh ở box Tứ Trị (phía trên) trước.");
            return;
        }
        const goiHao = layHaoListTuCoreDOM();
        if (!goiHao) {
            alert("Vui lòng chọn Họ Quẻ và Tên Quẻ Chủ ở phần trên trước.");
            return;
        }
        const tuanKhong = layTuanKhongChiTuM01();
        const m02Data = layDuLieuTuModule02();
        const m03Data = layDuLieuTuModule03();
        const haoDangBiMo = layDanhSachHaoDangBiMo(m03Data);
        duLieuHienTai = { tuTri, tuanKhong, haoList: goiHao.haoList, cungHanh: goiHao.cungHanh, m02Data, m03Data, haoDangBiMo };

        renderHaoPanels();
        renderDungThanOptions();
        $("m05_chayBtn").style.display = "block";
        $("m05_output").style.display = "none";
        $("m05_copyBtn").style.display = "none";

        if (!m02Data) console.info("m05.js: chưa có window.M02_DATA — bấm chạy Module 2 trước nếu muốn thấy Lục Thần trong kết quả.");
        if (!m03Data) console.info("m05.js: chưa có window.M03_DATA — bấm chạy Module 3 trước nếu muốn loại trừ hào đang bị Nhập Mộ khỏi các cờ tự suy sinh.");
    }

    function renderDungThanOptions() {
        const sel = $("m05_dungThanSo");
        sel.innerHTML = '<option value="">-- Không chọn --</option>';
        duLieuHienTai.haoList.forEach(h => {
            const opt = document.createElement("option");
            opt.value = h.soHao;
            opt.text = `Hào ${h.soHao} — ${h.lucThan} ${h.chi}${h.theUng ? " (" + h.theUng + ")" : ""}`;
            sel.appendChild(opt);
        });
    }

    function renderHaoPanels() {
        const container = $("m05_haoContainer");
        container.innerHTML = "";
        const { m02Data, haoDangBiMo } = duLieuHienTai;
        duLieuHienTai.haoList.forEach(hao => {
            const ctx = tuDoanContext(hao, duLieuHienTai.haoList, duLieuHienTai.cungHanh, haoDangBiMo);
            const lucThanM02 = (m02Data && m02Data.haoLucThan) ? m02Data.haoLucThan[hao.soHao] : null;
            const dangBiMo = haoDangBiMo.includes(hao.soHao);
            const panel = document.createElement("div");
            panel.style.cssText = "border:1px solid var(--gold); border-radius:8px; padding:10px; margin-bottom:10px;";
            panel.innerHTML = `
                <div style="font-size:0.85rem;color:var(--gold);font-weight:600;margin-bottom:8px;">
                    Hào ${hao.soHao}${hao.theUng ? " (" + hao.theUng + ")" : ""}: ${hao.lucThan} ${hao.chi} (${hao.isDong ? "Động" : "Tĩnh"})${hao.hb ? " -> Biến: " + hao.hb.lucThan + " " + hao.hb.chi : ""}
                    ${lucThanM02 ? " | Lục Thần (m02): " + lucThanM02 : ""}
                    ${dangBiMo ? " | ⚠️ ĐANG BỊ NHẬP MỘ (m03)" : ""}
                </div>
                <label style="font-size:0.7rem;display:block;">Gần / Xa (phạm vi câu hỏi)</label>
                <select id="m05_${hao.soHao}_ganXa" style="margin-bottom:8px;">
                    <option value="">-- Chưa rõ --</option>
                    <option value="gan">Gần</option>
                    <option value="xa">Xa</option>
                </select>
                <label style="font-size:0.7rem;display:block;"><input type="checkbox" id="m05_${hao.soHao}_haoDongKhacSinh" ${ctx.haoDongKhacSinh ? "checked" : ""}> Có Hào Động khác trong quẻ sinh cho hào này (tự suy, có thể sửa)</label>
                <label style="font-size:0.7rem;display:block;"><input type="checkbox" id="m05_${hao.soHao}_qbHoiDauSinh" ${ctx.qbHoiDauSinh ? "checked" : ""}> Hào Biến của chính nó Hồi Đầu Sinh (tự suy, có thể sửa)</label>
                <label style="font-size:0.7rem;display:block;"><input type="checkbox" id="m05_${hao.soHao}_qbVuongXa"> QB đó đang/sẽ Vượng đúng lúc Xa (tự xác nhận)</label>
                <label style="font-size:0.7rem;display:block;"><input type="checkbox" id="m05_${hao.soHao}_hbKhacSinh_coTT" ${ctx.haoBienKhacDongSinh.coTuongTac ? "checked" : ""}> Hào Biến của 1 hào Động KHÁC đến sinh (tự suy, có thể sửa)</label>
                <label style="font-size:0.7rem;display:block;"><input type="checkbox" id="m05_${hao.soHao}_hbKhacSinh_tuDo"> ...và ĐỦ điều kiện "tự do" (tự xác nhận tay — xem 5 điều kiện trong ghi chú code)</label>
                <label style="font-size:0.7rem;display:block;"><input type="checkbox" id="m05_${hao.soHao}_hoQueSinh" ${ctx.hoQueSinh ? "checked" : ""}> Được Họ Quẻ (Cung Quái) sinh (tự suy, có thể sửa)</label>
                <label style="font-size:0.7rem;display:block;"><input type="checkbox" id="m05_${hao.soHao}_coCuuThan"> Xa mà Suy — có cứu thần nào khác không (tick nếu CÓ)</label>
                <label style="font-size:0.7rem;display:block;"><input type="checkbox" id="m05_${hao.soHao}_nhatXungCungHanh"> Nhật Xung + hào cùng hành với Nhật (case đề xuất C-MR.8)</label>
                <label style="font-size:0.7rem;display:block;"><input type="checkbox" id="m05_${hao.soHao}_khongBiKhac"> Không bị khắc thương nội bộ nào khác</label>
            `;
            container.appendChild(panel);
        });
    }

    function docContextTuForm(haoSo) {
        return {
            ganXa: $(`m05_${haoSo}_ganXa`).value || null,
            qbHoiDauSinh: $(`m05_${haoSo}_qbHoiDauSinh`).checked,
            qbHoiDauSinhVuongLucTaiThoiDiemXa: $(`m05_${haoSo}_qbVuongXa`).checked,
            haoDongKhacSinh: $(`m05_${haoSo}_haoDongKhacSinh`).checked,
            haoBienKhacDongSinh: {
                coTuongTac: $(`m05_${haoSo}_hbKhacSinh_coTT`).checked,
                tuDo: $(`m05_${haoSo}_hbKhacSinh_tuDo`).checked
            },
            hoQueSinh: $(`m05_${haoSo}_hoQueSinh`).checked,
            coCuuThanNaoKhac: $(`m05_${haoSo}_coCuuThan`).checked,
            nhatXungCungHanhVoiNhat: $(`m05_${haoSo}_nhatXungCungHanh`).checked,
            khongBiKhacThuongNoiBo: $(`m05_${haoSo}_khongBiKhac`).checked
        };
    }

    function dinhDangMotHao(ket) {
        let s = "";
        s += `Cấp nền (thang 5 cấp): ${ket.capNenThang5.nhan}\n`;
        s += `  Với Nhật: ${ket.quanHeThoTuTri.nhat.tags.join(", ") || "(không có tag đặc biệt)"}\n`;
        s += `  Với Nguyệt: ${ket.quanHeThoTuTri.nguyet.tags.join(", ") || "(không có tag đặc biệt)"}\n`;
        if (ket.quanHeThoTuTri.thoi) s += `  Với Thời: ${ket.quanHeThoTuTri.thoi.tags.join(", ") || "(không có tag đặc biệt)"}\n`;
        s += `  Vượng Suy theo mùa Nguyệt Lệnh (tham khảo): ${ket.muaVuongSuy || "?"}\n`;
        if (ket.truongSinh.taiNhat.length) s += `  Trường Sinh tại Nhật: ${ket.truongSinh.taiNhat.join(", ")}\n`;
        if (ket.truongSinh.taiNguyet.length) s += `  Trường Sinh tại Nguyệt: ${ket.truongSinh.taiNguyet.join(", ")}\n`;

        if (ket.caseApDung.length) {
            s += `  Case C-MR áp dụng được:\n`;
            ket.caseApDung.forEach(c => {
                s += `    • [${c.code}] ${c.dieuKien || ""}\n`;
                if (c.ganKetLuan) s += `      Gần: ${c.ganKetLuan}\n`;
                if (c.xaKetLuan) s += `      Xa: ${c.xaKetLuan}\n`;
                if (c.ketLuan) s += `      Kết luận: ${c.ketLuan}\n`;
                if (c.dieuKienTuDo) s += `      ${c.dieuKienTuDo}\n`;
                if (c.apDung) s += `      Áp dụng theo: ${c.apDung}\n`;
            });
        } else {
            s += `  (Không có case C-MR nào được kích hoạt theo context hiện tại)\n`;
        }

        s += `  Tầng Thái Tuế: ${ket.tangThaiTue.dienGiai}\n`;
        if (ket.khiThoNote) s += `  Khí Thổ: ${ket.khiThoNote}\n`;
        if (ket.deXuat.length) s += `  Đề xuất đọc: ${ket.deXuat.join(" | ")}\n`;
        return s;
    }

    function chayPhanTich() {
        if (!duLieuHienTai) { alert("Bấm Trích Xuất trước."); return; }
        const R = window.LucHaoR22;
        const { tuTri, m02Data, m03Data, haoDangBiMo } = duLieuHienTai;

        let text = "=== MODULE 5 — THANG ĐO NĂNG LƯỢNG HÀO (R2.2) ===\n";
        text += `Tứ Trị: Thời=${tuTri.thoi || "?"}  Nhật=${tuTri.nhat || "?"}  Nguyệt=${tuTri.nguyet || "?"}  Thái Tuế=${tuTri.tue || "?"}\n`;

        if (m02Data && Array.isArray(m02Data.tuanKhongChi) && duLieuHienTai.tuanKhong.length) {
            const a = [...duLieuHienTai.tuanKhong].sort().join(",");
            const b = [...m02Data.tuanKhongChi].sort().join(",");
            if (a !== b) {
                text += `⚠️ CẢNH BÁO: Tuần Không của Module 1 [${duLieuHienTai.tuanKhong.join(", ")}] KHÁC Module 2 [${m02Data.tuanKhongChi.join(", ")}] — kiểm tra lại Nhật Thần đã nhập ở 2 nơi (có thể lệch nhau).\n`;
            }
        }
        if (haoDangBiMo.length) {
            text += `Hào đang bị Nhập Mộ (theo Module 3): ${haoDangBiMo.join(", ")} — đã loại các hào này khỏi vai trò "nguồn sinh" khi tự suy context bên dưới.\n`;
        }
        text += "\n";

        const ketQuaTheoHao = {};
        duLieuHienTai.haoList.forEach(hao => {
            const context = docContextTuForm(hao.soHao);
            const input = {
                hao: { hanh: R.nguHanh(hao.chi), chi: hao.chi, ten: `Hào ${hao.soHao} - ${hao.lucThan} ${hao.chi}${hao.theUng ? " (" + hao.theUng + ")" : ""}` },
                tuTru: tuTri,
                context
            };
            const ket = R.analyzeHao(input);
            ketQuaTheoHao[hao.soHao] = ket;

            const lucThanM02 = (m02Data && m02Data.haoLucThan) ? m02Data.haoLucThan[hao.soHao] : null;
            const dangBiMo = haoDangBiMo.includes(hao.soHao);
            text += `--- Hào ${hao.soHao}${hao.theUng ? " (" + hao.theUng + ")" : ""}: ${hao.lucThan} ${hao.chi} (${hao.isDong ? "ĐỘNG" : "Tĩnh"})${lucThanM02 ? ", Lục Thần: " + lucThanM02 : ""}${dangBiMo ? ", ĐANG BỊ NHẬP MỘ" : ""} ---\n`;
            text += dinhDangMotHao(ket);

            if (hao.isDong && hao.hb) {
                const inputBien = {
                    hao: { hanh: R.nguHanh(hao.hb.chi), chi: hao.hb.chi, ten: `Hào Biến của Hào ${hao.soHao} - ${hao.hb.lucThan} ${hao.hb.chi}` },
                    tuTru: tuTri,
                    context: {}
                };
                const ketBien = R.analyzeHao(inputBien);
                text += `  [Hào Biến ${hao.hb.chi}]:\n`;
                text += dinhDangMotHao(ketBien).split("\n").map(l => "  " + l).join("\n") + "\n";
            }
            text += "\n";
        });

        const dungThanSo = $("m05_dungThanSo").value;
        const theHao = duLieuHienTai.haoList.find(h => h.theUng === "Thế");
        if (dungThanSo && theHao && ketQuaTheoHao[theHao.soHao] && ketQuaTheoHao[dungThanSo]) {
            const rule = R.xetTheDung(ketQuaTheoHao[theHao.soHao], ketQuaTheoHao[dungThanSo]);
            text += `=== ĐỐI CHIẾU THẾ - DỤNG (AND cứng) ===\n`;
            text += `${rule.ghiChu}\n${rule.luuY}\n`;
            text += `Thế (Hào ${theHao.soHao}): cấp nền ${ketQuaTheoHao[theHao.soHao].capNenThang5.nhan}\n`;
            text += `Dụng (Hào ${dungThanSo}): cấp nền ${ketQuaTheoHao[dungThanSo].capNenThang5.nhan}\n\n`;
        } else if (dungThanSo && !theHao) {
            text += `(Không tìm thấy hào Thế trong quẻ hiện tại nên bỏ qua đối chiếu Thế-Dụng.)\n\n`;
        }

        text += "=== HẾT MODULE 5 — THANG ĐO NĂNG LƯỢNG HÀO ===";

        const outputEl = $("m05_output");
        outputEl.value = text;
        outputEl.style.display = "block";
        $("m05_copyBtn").style.display = "block";
        $("m05_fallbackBox").style.display = "none";
    }

    function copyKetQua() {
        const text = $("m05_output").value;
        if (!text) return;
        function showSuccess() {
            const btn = $("m05_copyBtn");
            $("m05_fallbackBox").style.display = "none";
            btn.innerText = "✅ ĐÃ SAO CHÉP!";
            setTimeout(() => { btn.innerText = "📋 SAO CHÉP KẾT QUẢ THANG ĐO NĂNG LƯỢNG"; }, 2000);
        }
        function showFallback() {
            const fbBox = $("m05_fallbackBox");
            const ta = $("m05_fallbackText");
            ta.value = text;
            fbBox.style.display = "block";
            ta.focus();
            ta.select();
        }
        function tryExecCommandCopy() {
            try {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.style.position = "fixed";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.focus();
                ta.select();
                const ok = document.execCommand("copy");
                document.body.removeChild(ta);
                return ok;
            } catch (e) { return false; }
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(showSuccess).catch(() => {
                if (tryExecCommandCopy()) showSuccess(); else showFallback();
            });
        } else if (tryExecCommandCopy()) {
            showSuccess();
        } else {
            showFallback();
        }
    }

    $("m05_trichXuatBtn").addEventListener("click", trichXuat);
    $("m05_chayBtn").addEventListener("click", chayPhanTich);
    $("m05_copyBtn").addEventListener("click", copyKetQua);

})();
