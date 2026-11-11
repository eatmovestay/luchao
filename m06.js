/*
=====================================================================
 m06.js — XUNG - PHÁ - ÁM ĐỘNG  (chuyên trách R2: Xung - Phá - Ám Động)
=====================================================================
 PHẠM VI: module này CHỈ xử lý Xung - Phá - Ám Động cho 6 hào của Quẻ Chủ
 (và Hào Biến nếu hào Động). KHÔNG xử lý Hình - Hại - Mộ - Tuyệt, KHÔNG xử
 lý Giả Không / Thực Không của Tuần Không (các chuyên mục khác đảm nhiệm) —
 Tuần Không ở đây chỉ được ghi nhận làm cờ thông tin (flag) để module khác
 dùng, không tự kết luận Giả/Thực.
 Phục Thần KHÔNG được tự tính trong module này (file nền không có cấu trúc
 Phục Thần sẵn) — nếu cần, bổ sung ở module Phục Thần riêng rồi đẩy dữ liệu
 vào qua window.LucHaoModules theo đúng quy ước bên dưới.

 NGUỒN DỮ LIỆU TỰ ĐỘNG LẤY TỪ FILE NỀN (total.html) + CÁC MODULE TRƯỚC:
  - Tứ Trị (Thời/Nhật/Nguyệt/Thái Tuế): đọc trực tiếp từ các input
    #mThoi #mNhat #mNguyet #mThaiTue (giữ nguyên định dạng "Can Chi", chỉ
    lấy phần Chi để tính Xung/Hợp).
  - Tuần Không: đọc từ #mTuanKhong (chấp nhận 1 hoặc nhiều Chi).
  - Quẻ Chủ, Hào Động, Quẻ Biến: đọc từ các biến global có sẵn trong file
    nền — dataDich, selectedDong, bienQueGiam (được file nền cập nhật khi
    người dùng chọn Họ Quẻ / Tên Quẻ / Hào Động).
  - Vượng Suy: tái dùng thẳng bảng VUONG_SUY_TABLE đã có sẵn trong file nền
    (không định nghĩa lại, tránh lệch số liệu giữa 2 nơi).

 QUY ƯỚC CHO CÁC MODULE SAU (m07 -> m60) — ĐỂ AUTO KẾ THỪA DỮ LIỆU:
  - Kết quả của module này được lưu tại:  window.LucHaoModules.m06
  - Cấu trúc:
      {
        module: 'm06', label: 'Xung - Phá - Ám Động',
        tuTri: { thoi, nhat, nguyet, thaiTue },   // chỉ phần Chi
        tuanKhong: [ ...danh sách Chi lâm Tuần Không... ],
        que: { cungKey, name },
        haoDong: [ ...số hào đang Động... ],
        results: {
          1: { hao, chi, isDong, bienChi, tuanKhong, caseApplied:[...],
               chiTiet:[...], ketLuan },
          ... đến 6
        },
        updatedAt: ISO timestamp
      }
  - Mỗi lần người dùng bấm nút "TÍNH XUNG - PHÁ - ÁM ĐỘNG", module bắn thêm
    sự kiện:
      document.dispatchEvent(new CustomEvent('luchao:module:updated', {
        detail: { module: 'm06', data: window.LucHaoModules.m06 }
      }))
    -> Module sau có thể lắng nghe sự kiện này (document.addEventListener)
       hoặc đọc trực tiếp window.LucHaoModules.m06 bất cứ lúc nào.
  - ĐỀ NGHỊ: mọi module tiếp theo (m07+) nên theo đúng quy ước này — tự lưu
    kết quả của mình vào window.LucHaoModules.<tên module riêng> và bắn
    cùng dạng sự kiện 'luchao:module:updated' — để toàn bộ chuỗi R1 → R24
    tự động kế thừa dữ liệu lẫn nhau mà không phải sửa lại các module cũ.
=====================================================================
*/

(function () {
  'use strict';

  // Namespace dùng chung cho toàn bộ chuỗi module — tạo nếu chưa có,
  // không ghi đè nếu module trước đã tạo rồi.
  window.LucHaoModules = window.LucHaoModules || {};

  // ---------------------------------------------------------------
  // BẢNG NGŨ HÀNH / XUNG / HỢP (độc lập, không phụ thuộc file nền)
  // ---------------------------------------------------------------
  var CHI_WUXING = {
    "Tý": "Thủy", "Sửu": "Thổ", "Dần": "Mộc", "Mão": "Mộc",
    "Thìn": "Thổ", "Tỵ": "Hỏa", "Ngọ": "Hỏa", "Mùi": "Thổ",
    "Thân": "Kim", "Dậu": "Kim", "Tuất": "Thổ", "Hợi": "Thủy"
  };
  // X sinh ra hành nào: WUXING_SINH[X] = Y nghĩa là X sinh Y
  var WUXING_SINH = { "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim", "Kim": "Thủy" };
  // X khắc hành nào: WUXING_KHAC[X] = Y nghĩa là X khắc Y
  var WUXING_KHAC = { "Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim" };

  // Cặp Xung (đối xứng)
  var XUNG_PAIR = {
    "Tý": "Ngọ", "Ngọ": "Tý", "Sửu": "Mùi", "Mùi": "Sửu",
    "Dần": "Thân", "Thân": "Dần", "Mão": "Dậu", "Dậu": "Mão",
    "Thìn": "Tuất", "Tuất": "Thìn", "Tỵ": "Hợi", "Hợi": "Tỵ"
  };
  // Cặp Lục Hợp (đối xứng)
  var LUCHOP_PAIR = {
    "Tý": "Sửu", "Sửu": "Tý", "Dần": "Hợi", "Hợi": "Dần",
    "Mão": "Tuất", "Tuất": "Mão", "Thìn": "Dậu", "Dậu": "Thìn",
    "Tỵ": "Thân", "Thân": "Tỵ", "Ngọ": "Mùi", "Mùi": "Ngọ"
  };

  function isXung(a, b) { return !!a && !!b && XUNG_PAIR[a] === b; }
  function isLucHop(a, b) { return !!a && !!b && LUCHOP_PAIR[a] === b; }

  // Chủ (Tứ Trị) xung Khách (Hào): trả về true nếu "vừa Xung vừa Khắc",
  // false nếu "chỉ Xung không Khắc", null nếu 2 chi không hề Xung nhau.
  function vuaXungVuaKhac(chuChi, khachChi) {
    if (!isXung(chuChi, khachChi)) return null;
    var chuHanh = CHI_WUXING[chuChi], khachHanh = CHI_WUXING[khachChi];
    return WUXING_KHAC[chuHanh] === khachHanh;
  }

  // Lấy hạng Vượng Suy (so với 1 Chi mốc) bằng cách tái dùng bảng có sẵn
  // trong file nền (VUONG_SUY_TABLE). Trả về số hạng (5..1) hoặc null nếu
  // không đọc được (ví dụ file nền chưa nạp xong).
  function getLevelRank(chi, relChi) {
    try {
      if (typeof VUONG_SUY_TABLE !== 'undefined' && VUONG_SUY_TABLE[chi] && VUONG_SUY_TABLE[chi][relChi]) {
        var raw = VUONG_SUY_TABLE[chi][relChi];
        var first = raw.split(/[,+]/)[0].trim();
        if (first.indexOf('Vượng') === 0) return 5;
        if (first.indexOf('Tướng') === 0) return 4;
        if (first.indexOf('Hưu') === 0) return 3;
        if (first.indexOf('Tù') === 0) return 2;
        if (first.indexOf('Tử') === 0) return 1;
      }
    } catch (e) { /* ignore */ }
    return null;
  }
  function rankLabel(r) {
    return { 5: 'Vượng', 4: 'Tướng', 3: 'Hưu', 2: 'Tù', 1: 'Tử' }[r] || 'chưa rõ';
  }

  // "Canh Thân" -> "Thân" (lấy token cuối cùng làm Chi)
  function parseChi(input) {
    if (!input) return '';
    var parts = input.trim().split(/\s+/);
    return parts[parts.length - 1];
  }

  // Đọc danh sách Chi lâm Tuần Không từ ô nhập tự do (chấp nhận 1 hoặc
  // nhiều Chi, phân cách bất kỳ)
  function parseTuanKhongList(input) {
    if (!input) return [];
    var found = [];
    var list = (typeof CHI_LIST !== 'undefined') ? CHI_LIST :
      ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
    list.forEach(function (c) { if (input.indexOf(c) !== -1) found.push(c); });
    return found;
  }

  // ---------------------------------------------------------------
  // ENGINE CỨU THẦN — xét 1 hào
  // ---------------------------------------------------------------
  function xetHao(haoSo, chi, isDong, bienChi, tuTri, tuanKhongList) {
    var nhatChi = tuTri.nhatChi, nguyetChi = tuTri.nguyetChi;
    var result = {
      hao: haoSo, chi: chi, isDong: isDong, bienChi: bienChi || null,
      tuanKhong: tuanKhongList.indexOf(chi) !== -1,
      caseApplied: [], chiTiet: [], ketLuan: ''
    };

    if (!chi) {
      result.ketLuan = 'Thiếu dữ liệu Chi của hào — kiểm tra lại Họ Quẻ / Tên Quẻ ở phần trên.';
      return result;
    }

    var xungByNhat = isXung(nhatChi, chi);
    var xungByNguyet = isXung(nguyetChi, chi);

    if (!xungByNhat && !xungByNguyet) {
      result.caseApplied.push('Không áp dụng (không bị Xung)');
      result.ketLuan = 'Không bị Xung bởi Nhật/Nguyệt — ngoài phạm vi Xung-Phá-Ám Động, giữ nguyên Vượng Suy/Sinh Khắc thông thường.';
      return result;
    }

    if (xungByNhat) {
      var vkN = vuaXungVuaKhac(nhatChi, chi);
      result.chiTiet.push('Bị Nhật (' + nhatChi + ') xung — ' + (vkN ? 'vừa Xung vừa Khắc' : 'chỉ Xung không Khắc') + '.');
    }
    if (xungByNguyet) {
      var vkG = vuaXungVuaKhac(nguyetChi, chi);
      result.chiTiet.push('Bị Nguyệt (' + nguyetChi + ') xung — ' + (vkG ? 'vừa Xung vừa Khắc' : 'chỉ Xung không Khắc') + '.');
    }

    var bothXung = xungByNhat && xungByNguyet;

    // ---- TẦNG 1: Trực / Hợp (dây neo) — ưu tiên Nhật(1) > Nguyệt(2) > Hào Biến(3) ----
    var rescue = null;

    // Cứu từ Nhật — chỉ hợp lệ nếu Nhật KHÔNG phải thủ phạm (tức hào chỉ bị Nguyệt xung)
    if (!rescue && xungByNguyet && !xungByNhat) {
      if (nhatChi === chi) rescue = { source: 'Nhật', kind: 'Trực' };
      else if (isLucHop(nhatChi, chi)) rescue = { source: 'Nhật', kind: 'Hợp' };
    }
    // Cứu từ Nguyệt — chỉ hợp lệ nếu Nguyệt KHÔNG phải thủ phạm (tức hào chỉ bị Nhật xung)
    if (!rescue && xungByNhat && !xungByNguyet) {
      if (nguyetChi === chi) rescue = { source: 'Nguyệt', kind: 'Trực' };
      else if (isLucHop(nguyetChi, chi)) rescue = { source: 'Nguyệt', kind: 'Hợp' };
    }
    // Cứu từ Hào Biến (bậc 3) — xét khi chưa có cứu ở trên, hào phải Động và Biến ra chi hợp
    if (!rescue && isDong && bienChi) {
      if (isLucHop(bienChi, chi)) {
        var bienRank = getLevelRank(bienChi, nguyetChi);
        if (bienRank === null || bienRank >= 3) {
          rescue = { source: 'Hào Biến', kind: 'Hợp', bienChi: bienChi, bienRank: bienRank };
        } else {
          result.chiTiet.push('Hào Biến ' + bienChi + ' hợp ' + chi + ' nhưng lực chỉ ở mức ' + rankLabel(bienRank) + ' (dưới Hưu Tù) — không đủ sức cứu.');
        }
      }
    }

    if (rescue) {
      result.caseApplied.push('Cứu Thần: ' + rescue.source + ' - ' + rescue.kind);
      if (rescue.kind === 'Trực') {
        result.ketLuan = 'ÁM ĐỘNG — được ' + rescue.source + ' Trực cứu.';
      } else if (rescue.source === 'Hào Biến') {
        result.ketLuan = 'Không hỏng, KHÔNG phải Ám Động — có lực để tương tác/sinh cho hào khác (được Hào Biến ' + rescue.bienChi + ' hợp cứu, cứu thần bậc 3).';
      } else {
        result.ketLuan = 'An toàn, không Phá — nhưng bị ràng buộc với "đại nhân" ' + rescue.source + ' (Hợp). Không tính là Ám Động.';
      }
      // Tầng 2 (bonus): ghi chú thêm nếu còn được Sinh (không đổi nhãn chính)
      var sinhNguon = [];
      if (WUXING_SINH[CHI_WUXING[nhatChi]] === CHI_WUXING[chi] && !xungByNhat) sinhNguon.push('Nhật');
      if (WUXING_SINH[CHI_WUXING[nguyetChi]] === CHI_WUXING[chi] && !xungByNguyet) sinhNguon.push('Nguyệt');
      if (sinhNguon.length) {
        result.chiTiet.push('Bonus: còn được ' + sinhNguon.join(', ') + ' Sinh thêm — mức độ khỏe tốt hơn mức tối thiểu.');
      }
      return result;
    }

    // ---- Không có cứu Tầng 1 ----
    if (bothXung) {
      result.chiTiet.push('Bị Xung kép đồng thời bởi cả Nhật lẫn Nguyệt (trùng chi ' + nhatChi + '), không có nguồn Trực/Hợp độc lập nào để cứu.');
      var nenRank = getLevelRank(chi, nguyetChi);
      result.caseApplied.push('Xung kép Nhật+Nguyệt, không cứu');
      if (nenRank !== null && nenRank <= 2) {
        result.ketLuan = 'XUNG TÁN / PHÁ THẬT — nền ở mức ' + rankLabel(nenRank) + ' (Tù trở xuống), bị Xung kép không ai cứu được, hỏng hoàn toàn.';
      } else {
        result.ketLuan = 'XUNG TÁN / PHÁ THẬT (nhiều khả năng) — bị Xung kép Nhật-Nguyệt, không có Trực/Hợp/Hào Biến nào cứu được. Lưu ý: module này chỉ xét trong phạm vi 6 hào + Tứ Trị — nếu trong quẻ còn hào Động khác Sinh trợ thêm cho hào này thì cần người dùng tự đối chiếu trước khi chốt kết luận.';
      }
      return result;
    }

    if (xungByNhat) {
      var nguyetSinh = WUXING_SINH[CHI_WUXING[nguyetChi]] === CHI_WUXING[chi];
      if (nguyetSinh) {
        var rankN = getLevelRank(chi, nguyetChi);
        result.caseApplied.push('Nhật xung, Nguyệt Sinh (bonus, không Hợp)');
        if (rankN !== null && rankN >= 4) {
          result.ketLuan = 'ÁM ĐỘNG — được Nguyệt Sinh bồi dưỡng, đạt mức ' + rankLabel(rankN) + '.';
        } else if (rankN === 3) {
          result.ketLuan = 'ÁM ĐỘNG YẾU — được Nguyệt Sinh nhưng chỉ đạt mức Hưu, có hoạt động nhưng kém hơn bình thường (như người bệnh vẫn đi được).';
        } else {
          result.ketLuan = 'NHẬT PHÁ (Phá thật) — tuy có Nguyệt Sinh nhưng lực tổng vẫn dưới mức Hưu Tù, không đủ cứu.';
        }
      } else {
        result.caseApplied.push('Nhật xung, không Sinh không Hợp');
        result.ketLuan = 'NHẬT PHÁ (Phá thật) — không có cứu thần nào (không Trực/Hợp từ Nguyệt, không Sinh, không Hào Biến hợp).';
      }
      return result;
    }

    if (xungByNguyet) {
      result.caseApplied.push('Nguyệt xung, không Hợp cứu (Sinh suông không đủ)');
      result.ketLuan = 'NGUYỆT PHÁ (Phá thật) — không có Trực/Hợp từ Nhật, không có Hào Biến hợp đủ lực. Sinh ngũ hành đơn thuần (nếu có) không đắc dụng, vẫn tính Phá.';
      return result;
    }

    return result;
  }

  // ---------------------------------------------------------------
  // ĐỌC DỮ LIỆU TỪ FILE NỀN + TRẠNG THÁI HIỆN TẠI CỦA TRANG
  // ---------------------------------------------------------------
  function readBaseData() {
    function get(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }

    var cungKey = get('selectCung');
    var queName = get('selectQue');
    var chuData = null, cungChu = null;
    if (typeof dataDich !== 'undefined' && cungKey && queName &&
      dataDich[cungKey] && dataDich[cungKey].quẻ[queName]) {
      chuData = dataDich[cungKey].quẻ[queName];
      cungChu = dataDich[cungKey];
    }

    var dong = (typeof selectedDong !== 'undefined') ? selectedDong.slice() : [];
    var bien = (typeof bienQueGiam !== 'undefined') ? bienQueGiam : null;

    return {
      thoiChi: parseChi(get('mThoi')),
      nhatChi: parseChi(get('mNhat')),
      nguyetChi: parseChi(get('mNguyet')),
      thaiTueChi: parseChi(get('mThaiTue')),
      tuanKhongList: parseTuanKhongList(get('mTuanKhong')),
      cungKey: cungKey, queName: queName, chuData: chuData, cungChu: cungChu,
      dong: dong, bien: bien
    };
  }

  function getHaoChi(chuData, h) {
    if (typeof getChiHanh !== 'function') return '';
    var chiHanh = getChiHanh(chuData.n[h - 1]);
    return chiHanh.split(' ')[0];
  }
  function getBienChi(bien, h) {
    if (!bien || !bien.data || typeof getChiHanh !== 'function') return null;
    var chiHanh = getChiHanh(bien.data.n[h - 1]);
    return chiHanh.split(' ')[0] || null;
  }

  // ---------------------------------------------------------------
  // XUẤT TEXT THUẦN
  // ---------------------------------------------------------------
  function buildOutputText(ctx, results) {
    var t = '';
    t += '=== KẾT QUẢ XUNG - PHÁ - ÁM ĐỘNG (m06) ===\n';
    t += 'Quẻ: ' + (ctx.queName || '(chưa chọn)') + (ctx.cungChu ? ' (Họ ' + ctx.cungChu.name + ')' : '') + '\n';
    t += 'Tứ Trị: Thái Tuế ' + (ctx.thaiTueChi || '-') + ' | Nguyệt Lệnh ' + (ctx.nguyetChi || '-') +
      ' | Nhật Thần ' + (ctx.nhatChi || '-') + ' | Thời ' + (ctx.thoiChi || '-') + '\n';
    t += 'Tuần Không: ' + (ctx.tuanKhongList.length ? ctx.tuanKhongList.join(', ') : 'Không có') + '\n';
    t += (ctx.dong.length ? 'Hào Động: ' + ctx.dong.join(', ') : 'Quẻ Tĩnh (không hào nào Động)') + '\n';
    t += '\n--- CHI TIẾT TỪNG HÀO (nhận định sơ bộ của AI theo engine Xung-Phá-Ám Động — người dùng tự đối chiếu, chọn lọc trước khi đưa sang R3) ---\n\n';

    [6, 5, 4, 3, 2, 1].forEach(function (h) {
      var r = results[h];
      if (!r) return;
      t += 'HÀO ' + h + ' (' + r.chi + (r.isDong ? ', Động' : '') +
        (r.bienChi ? ' -> Biến ' + r.bienChi : '') + (r.tuanKhong ? ', Tuần Không' : '') + '):\n';
      r.chiTiet.forEach(function (line) { t += '  - ' + line + '\n'; });
      t += '  Case áp dụng: ' + (r.caseApplied.join('; ') || 'Không có') + '\n';
      t += '  => Kết luận: ' + r.ketLuan + '\n\n';
    });

    t += '--- GHI CHÚ ---\n';
    t += 'Module này CHỈ xử lý Xung - Phá - Ám Động. Hình-Hại-Mộ-Tuyệt và Giả/Thực Không do chuyên mục khác đảm nhiệm.\n';
    t += 'Phục Thần (nếu có) chưa được module này tự tính — bổ sung ở module Phục Thần riêng.\n';
    return t;
  }

  // ---------------------------------------------------------------
  // XỬ LÝ CHÍNH + GHI RA CHO MODULE SAU
  // ---------------------------------------------------------------
  function m06Process() {
    var ctx = readBaseData();
    var results = {};

    if (ctx.chuData && ctx.nhatChi && ctx.nguyetChi) {
      for (var h = 1; h <= 6; h++) {
        var chi = getHaoChi(ctx.chuData, h);
        var isDong = ctx.dong.indexOf(h) !== -1;
        var bienChi = isDong ? getBienChi(ctx.bien, h) : null;
        results[h] = xetHao(h, chi, isDong, bienChi,
          { nhatChi: ctx.nhatChi, nguyetChi: ctx.nguyetChi }, ctx.tuanKhongList);
      }
    }

    var outEl = document.getElementById('m06_output');
    if (outEl) {
      if (!ctx.chuData) {
        outEl.value = 'Chưa chọn đủ Họ Quẻ / Tên Quẻ Chủ ở phần trên.';
      } else if (!ctx.nhatChi || !ctx.nguyetChi) {
        outEl.value = 'Vui lòng nhập đầy đủ Nhật Thần và Nguyệt Lệnh ở khung "Lập Quẻ & Xử Lý Dữ Liệu Lập Thời" phía trên trước khi tính.';
      } else {
        outEl.value = buildOutputText(ctx, results);
      }
      outEl.style.display = 'block';
    }

    window.LucHaoModules.m06 = {
      module: 'm06',
      label: 'Xung - Phá - Ám Động',
      tuTri: { thoi: ctx.thoiChi, nhat: ctx.nhatChi, nguyet: ctx.nguyetChi, thaiTue: ctx.thaiTueChi },
      tuanKhong: ctx.tuanKhongList,
      que: { cungKey: ctx.cungKey, name: ctx.queName },
      haoDong: ctx.dong,
      results: results,
      updatedAt: new Date().toISOString()
    };

    document.dispatchEvent(new CustomEvent('luchao:module:updated', {
      detail: { module: 'm06', data: window.LucHaoModules.m06 }
    }));

    return window.LucHaoModules.m06;
  }

  function m06Copy() {
    var el = document.getElementById('m06_output');
    if (!el || !el.value) return;
    var btn = document.getElementById('m06_btnCopy');
    function ok() {
      if (btn) { var old = btn.innerText; btn.innerText = '✅ ĐÃ SAO CHÉP!'; setTimeout(function () { btn.innerText = old; }, 2000); }
    }
    function fallback() {
      el.focus(); el.select();
      try { document.execCommand('copy'); ok(); } catch (e) { /* ignore */ }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(el.value).then(ok).catch(fallback);
    } else {
      fallback();
    }
  }

  // ---------------------------------------------------------------
  // THU GỌN / MỞ RỘNG
  // ---------------------------------------------------------------
  function m06ToggleCollapse() {
    var body = document.getElementById('m06_body');
    var btn = document.getElementById('m06_toggleBtn');
    if (!body) return;
    var willExpand = body.style.display === 'none';
    body.style.display = willExpand ? 'block' : 'none';
    if (btn) btn.innerText = willExpand ? '▲ Thu gọn' : '▼ Mở rộng';
    try { localStorage.setItem('m06_collapsed', willExpand ? '0' : '1'); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------
  // KHỞI TẠO UI (gắn vào khe #module-slots qua hàm moduleSlot() của file nền)
  // ---------------------------------------------------------------
  function init() {
    if (typeof moduleSlot !== 'function') {
      console.error('[m06] Không tìm thấy hàm moduleSlot() từ file nền — kiểm tra lại thứ tự nạp script.');
      return;
    }

    var html =
      '<div class="header" style="border-bottom:1px solid var(--gold); padding:5px 0 10px 0; margin-bottom:15px; display:flex; justify-content:space-between; align-items:center;">' +
      '<h1 style="font-size:1.05rem; margin:0;">M06 &middot; Xung - Phá - Ám Động</h1>' +
      '<button id="m06_toggleBtn" class="btn-secondary" style="width:auto; margin:0; padding:6px 10px; font-size:0.7rem;" onclick="m06ToggleCollapse()">&#9650; Thu gọn</button>' +
      '</div>' +
      '<div id="m06_body">' +
      '<button class="m-btn-process" onclick="m06Process()">&#9889; TÍNH XUNG - PHÁ - ÁM ĐỘNG</button>' +
      '<textarea id="m06_output" class="m-output-box" readonly onclick="this.select()"></textarea>' +
      '<button id="m06_btnCopy" class="btn-copy" style="display:block;" onclick="m06Copy()">&#128203; SAO CHÉP KẾT QUẢ M06</button>' +
      '</div>';

    moduleSlot(html);

    var savedCollapsed = '0';
    try { savedCollapsed = localStorage.getItem('m06_collapsed') || '0'; } catch (e) { /* ignore */ }
    if (savedCollapsed === '1') {
      document.getElementById('m06_body').style.display = 'none';
      document.getElementById('m06_toggleBtn').innerHTML = '&#9660; Mở rộng';
    }
  }

  // Để onclick trong HTML (chèn qua innerHTML) gọi được, expose ra global.
  window.m06Process = m06Process;
  window.m06Copy = m06Copy;
  window.m06ToggleCollapse = m06ToggleCollapse;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();