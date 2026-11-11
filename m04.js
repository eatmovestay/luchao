/* ============================================================
   m04.js — MODULE: TRẠNG THÁI HÀO (Tĩnh / Động / Biến / Phục Thần)
   Kinh Dịch Lục Hào — Cổ Pháp (R1 + R2.1 Xung-Phá-Ám Động + R2.2
   Thang Đo + Nguyên Tắc 3 mở rộng Hào Biến).

   ĐÃ ĐIỀU CHỈNH so với bản "basic" gốc để khớp code nền total.html:
   1) SỬA CHÍNH TẢ: toàn bộ "Tị" -> "Tỵ" (code nền/m01.js dùng "Tỵ"
      thống nhất; "Tị" là biến thể dấu khác, so khớp chuỗi sẽ trật —
      đúng loại lỗi đã từng gặp với "Hỏa/Hoả").
   2) THAY NGUỒN VƯỢNG SUY / TRƯỜNG SINH: bản gốc tự tính Vượng Suy
      theo MÙA của Nguyệt Lệnh (vuongSuyTheoMua) và tự tính Trường
      Sinh rút gọn 4 mốc (xetVongTruongSinh) — 2 hàm này VẪN giữ lại
      làm lớp tham khảo phụ, nhưng lớp CHÍNH dùng để so sánh/xét case
      giờ lấy trực tiếp từ VUONG_SUY_TABLE + resolveVuongSuy + getTruongSinh
      đã có sẵn trong total.html (theo đúng cặp Chi-Chi, không chỉ theo
      nhóm mùa) — để mọi module trong app luôn đồng nhất 1 nguồn Vượng
      Suy/Trường Sinh duy nhất, không ra 2 kết quả khác nhau cho cùng 1 hào.
   3) Không đổi bất kỳ logic case nào khác (Xung/Hợp/Hại/Phá/Tam Hợp/
      Tam Hình/Thoái Thần/Tuần Không Giả-Thật/Nguyên Tắc 3 Hào Biến).

   Module tự tạo UI qua moduleSlot() và tự lấy dữ liệu Tứ Trị (từ core)
   + Tuần Không & Phục Thần (từ m01.js, qua DOM — m01.js phải load TRƯỚC
   file này, đúng thứ tự m01 -> m04 đã có sẵn trong total.html).
   Mọi biến/hàm riêng được bọc trong 1 IIFE, chỉ public có chủ đích
   window.LucHaoTrangThai (để module sau, vd Mộ/Nguyệt Phá, tái dùng).
   ============================================================ */
(function () {
    "use strict";

    const NGU_HANH_CUA_CHI = {
        'Tý':'Thủy','Hợi':'Thủy',
        'Dần':'Mộc','Mão':'Mộc',
        'Tỵ':'Hỏa','Ngọ':'Hỏa',
        'Sửu':'Thổ','Thìn':'Thổ','Mùi':'Thổ','Tuất':'Thổ',
        'Thân':'Kim','Dậu':'Kim'
    };

    const SINH_MAP = { 'Thủy':'Mộc','Mộc':'Hỏa','Hỏa':'Thổ','Thổ':'Kim','Kim':'Thủy' };
    const KHAC_MAP = { 'Thủy':'Hỏa','Hỏa':'Kim','Kim':'Mộc','Mộc':'Thổ','Thổ':'Thủy' };

    const XUNG_PAIRS    = [['Tý','Ngọ'],['Sửu','Mùi'],['Dần','Thân'],['Mão','Dậu'],['Thìn','Tuất'],['Tỵ','Hợi']];
    const LUC_HOP_PAIRS = [['Tý','Sửu'],['Dần','Hợi'],['Mão','Tuất'],['Thìn','Dậu'],['Tỵ','Thân'],['Ngọ','Mùi']];
    const HAI_PAIRS     = [['Tý','Mùi'],['Sửu','Ngọ'],['Dần','Tỵ'],['Mão','Thìn'],['Thân','Hợi'],['Dậu','Tuất']];
    const PHA_PAIRS     = [['Tý','Dậu'],['Sửu','Thìn'],['Dần','Hợi'],['Mão','Ngọ'],['Tỵ','Thân'],['Mùi','Tuất']];

    const TAM_HOP_GROUPS = [
        { chis:['Thân','Tý','Thìn'], cuc:'Thủy' },
        { chis:['Hợi','Mão','Mùi'],  cuc:'Mộc' },
        { chis:['Dần','Ngọ','Tuất'], cuc:'Hỏa' },
        { chis:['Tỵ','Dậu','Sửu'],   cuc:'Kim' },
    ];

    const NHI_HINH_PAIRS = [['Tý','Mão']];
    const TAM_HINH_CHAINS = [
        ['Dần','Tỵ'], ['Tỵ','Thân'], ['Thân','Dần'],   // Tam Hình Vô Ân
        ['Sửu','Tuất'], ['Tuất','Mùi'], ['Mùi','Sửu'], // Tam Hình Thổ
    ];
    const TU_HINH_CHIS = ['Thìn','Ngọ','Dậu','Hợi']; // dự phòng, chưa dùng tới trong logic hiện tại

    // Thoái Thần: hào Động chi (key) hóa ra đúng chi (value) này thì tính là hoá THOÁI.
    // Theo xác nhận: Dần->Mão, Thân->Dậu, Tỵ->Ngọ, Tý->Hợi là chiều TIẾN (không phải
    // Thoái) nên KHÔNG có mặt ở đây làm key; chiều ngược lại của 4 cặp đó (Mão->Dần,
    // Dậu->Thân, Ngọ->Tỵ, Hợi->Tý) mới là Thoái Thần. 4 cặp Tứ Mộ (Sửu/Thìn/Mùi/Tuất)
    // giữ nguyên như bản gốc.
    const THOAI_THAN_MAP = { 'Tý':'Hợi','Sửu':'Tuất','Thìn':'Sửu','Mùi':'Thìn','Tuất':'Mùi','Mão':'Dần','Ngọ':'Tỵ','Dậu':'Thân' };

    // --- Lớp Vượng Suy THEO MÙA (giữ lại làm tham khảo phụ, không còn là lớp chính) ---
    const MUA_VUONG_SUY = {
        Xuan: { Mộc:'Vượng', Hỏa:'Tướng', Thủy:'Hưu', Kim:'Tù', Thổ:'Tử' },
        Ha:   { Hỏa:'Vượng', Thổ:'Tướng', Mộc:'Hưu', Thủy:'Tù', Kim:'Tử' },
        Thu:  { Kim:'Vượng', Thủy:'Tướng', Hỏa:'Hưu', Mộc:'Tù', Thổ:'Tử' },
        Dong: { Thủy:'Vượng', Mộc:'Tướng', Kim:'Hưu', Thổ:'Tù', Hỏa:'Tử' },
        TuQuy:{ Thổ:'Vượng', Kim:'Tướng', Hỏa:'Hưu', Mộc:'Tù', Thủy:'Tử' },
    };
    function muaCuaNguyetLenh(chiNguyet) {
        if (['Dần','Mão'].includes(chiNguyet)) return 'Xuan';
        if (['Tỵ','Ngọ'].includes(chiNguyet)) return 'Ha';
        if (['Thân','Dậu'].includes(chiNguyet)) return 'Thu';
        if (['Tý','Hợi'].includes(chiNguyet)) return 'Dong';
        if (['Sửu','Thìn','Mùi','Tuất'].includes(chiNguyet)) return 'TuQuy';
        return null;
    }
    function vuongSuyTheoMua(chiNguyet, hanh) {
        const mua = muaCuaNguyetLenh(chiNguyet);
        return mua ? MUA_VUONG_SUY[mua][hanh] : null;
    }

    /* ============================================================
       QUAN HỆ ĐỊA CHI CƠ BẢN (không đổi so với bản basic)
       ============================================================ */
    function coTrongCap(pairs, a, b) {
        return pairs.some(p => (p[0]===a && p[1]===b) || (p[0]===b && p[1]===a));
    }
    function laXung(a,b){ return coTrongCap(XUNG_PAIRS,a,b); }
    function laLucHop(a,b){ return coTrongCap(LUC_HOP_PAIRS,a,b); }
    function laHai(a,b){ return coTrongCap(HAI_PAIRS,a,b); }
    function laPha(a,b){ return coTrongCap(PHA_PAIRS,a,b); }
    function laNhiHinh(a,b){ return coTrongCap(NHI_HINH_PAIRS,a,b); }
    function laTamHinh(a,b){ return TAM_HINH_CHAINS.some(p=>p[0]===a && p[1]===b); }

    function aSinhB(a,b){ return SINH_MAP[NGU_HANH_CUA_CHI[a]] === NGU_HANH_CUA_CHI[b]; }
    function aKhacB(a,b){ return KHAC_MAP[NGU_HANH_CUA_CHI[a]] === NGU_HANH_CUA_CHI[b]; }

    function timTamHopCuc(danhSachChi) {
        const ketQua = [];
        for (const nhom of TAM_HOP_GROUPS) {
            const soKhop = nhom.chis.filter(c => danhSachChi.includes(c)).length;
            if (soKhop === 3) ketQua.push({ cuc: nhom.cuc, chis: nhom.chis, trangThai:'Đủ bộ - Tam Hợp Cục thành' });
            else if (soKhop === 2) ketQua.push({ cuc: nhom.cuc, chis: nhom.chis, trangThai:'Bán hợp (2/3) - chưa đủ Cục' });
        }
        return ketQua;
    }

    function xetTrucLam(chiHao, chiTru) {
        if (chiHao === chiTru) return 'Trực';
        if (NGU_HANH_CUA_CHI[chiHao] === NGU_HANH_CUA_CHI[chiTru]) return 'Lâm';
        return null;
    }

    function quanHeMotChieu(a, b) {
        const tags = [];
        if (a === b) return ['TrungChi'];
        if (aSinhB(a,b)) tags.push('Sinh');
        if (aKhacB(a,b)) tags.push('Khắc');
        if (laXung(a,b)) tags.push(aKhacB(a,b) ? 'XungKhắc' : 'XungThuần');
        if (laLucHop(a,b)) tags.push('LụcHợp');
        if (laHai(a,b)) tags.push('Hại');
        if (laPha(a,b)) tags.push('Phá');
        if (laNhiHinh(a,b) || laNhiHinh(b,a)) tags.push('NhịHình');
        if (laTamHinh(a,b)) tags.push('TamHình(Chủ->Khách)');
        if (laTamHinh(b,a)) tags.push('TamHình(bị hình ngược)');
        if (NGU_HANH_CUA_CHI[a] === NGU_HANH_CUA_CHI[b]) tags.push('CùngKhí');
        return tags;
    }

    /* ============================================================
       TỨ TRỊ BẤT KHẢ XÂM PHẠM
       ============================================================ */
    function quanHeTuTriToiHao(chiTru, tenTru, chiHao) {
        return {
            tru: tenTru, chiTru, chiHao,
            trucLam: xetTrucLam(chiHao, chiTru),
            tags: quanHeMotChieu(chiTru, chiHao),
        };
    }
    function haoHopTuTri(chiHao, chiTru) { return laLucHop(chiHao, chiTru); }

    // Trường Sinh 4-mốc rút gọn — GIỮ LẠI làm fallback nếu vì lý do nào đó
    // core chưa nạp getTruongSinh() (vd chạy thử độc lập không kèm total.html).
    const VONG_TRUONG_SINH = {
        'Kim': { TruongSinh:'Tỵ',  DeVuong:'Dậu', Mo:'Sửu',  Tuyet:'Dần' },
        'Mộc': { TruongSinh:'Hợi', DeVuong:'Mão', Mo:'Mùi',  Tuyet:'Thân' },
        'Thủy':{ TruongSinh:'Thân',DeVuong:'Tý',  Mo:'Thìn', Tuyet:'Tỵ' },
        'Hỏa': { TruongSinh:'Dần', DeVuong:'Ngọ', Mo:'Tuất', Tuyet:'Hợi' },
        'Thổ': { TruongSinh:'Thân',DeVuong:'Tý',  Mo:'Thìn', Tuyet:'Tỵ' },
    };
    function xetVongTruongSinh(hanhHao, chiTru) {
        const bang = VONG_TRUONG_SINH[hanhHao];
        if (!bang) return null;
        if (chiTru === bang.TruongSinh) return 'Trường Sinh';
        if (chiTru === bang.DeVuong) return 'Đế Vượng';
        if (chiTru === bang.Mo) return 'Mộ';
        if (chiTru === bang.Tuyet) return 'Tuyệt';
        return null;
    }

    // Lấy Trường Sinh ĐẦY ĐỦ 12 mốc — ưu tiên hàm getTruongSinh() của code nền
    // (dùng chi hào thật, không phải hanh, để tra đúng nhóm Mộc/Hỏa/Kim/ThủyThổ).
    function layTruongSinhKhopNen(chiHao, hanhHao, chiTru) {
        if (typeof getTruongSinh === "function") {
            try { return getTruongSinh(chiHao, chiTru); } catch (e) { /* rơi xuống fallback */ }
        }
        return xetVongTruongSinh(hanhHao, chiTru);
    }

    // Rút gọn chuỗi Vượng Suy đầy đủ (vd "Vượng + Xung Nhật") về đúng 1 trong 5
    // bậc chuẩn để dùng cho so sánh capLuc bên dưới.
    function layCapTuChuoiVuongSuy(chuoi) {
        const thuTu = ['Vượng','Tướng','Hưu','Tù','Tử'];
        for (const tu of thuTu) if (chuoi && chuoi.includes(tu)) return tu;
        return 'Hưu';
    }

    // Lấy Vượng Suy CHÍNH — ưu tiên VUONG_SUY_TABLE + resolveVuongSuy của code
    // nền (chính xác theo từng cặp Chi-Chi); nếu không có (chạy thử độc lập)
    // thì rơi xuống lớp mùa cũ.
    function layVuongSuyKhopNen(chiHao, chiTru, tenTru) {
        if (typeof VUONG_SUY_TABLE !== "undefined" && VUONG_SUY_TABLE[chiHao] && VUONG_SUY_TABLE[chiHao][chiTru]
            && typeof resolveVuongSuy === "function") {
            const chuoi = resolveVuongSuy(VUONG_SUY_TABLE[chiHao][chiTru], tenTru);
            return { chuoi, capLuc: layCapTuChuoiVuongSuy(chuoi) };
        }
        return null; // để gọi nơi dùng tự rơi xuống vuongSuyTheoMua()
    }

    /* ============================================================
       R2.1 — NHẬT XUNG / NGUYỆT XUNG -> ÁM ĐỘNG hay PHÁ
       ============================================================ */
    const CAP_LUC_THANG = ['Vô Căn','Tử','Tù','Hưu','Tướng','Vượng','Quá Vượng'];
    function soSanhCap(capA, capB) {
        return CAP_LUC_THANG.indexOf(capA) - CAP_LUC_THANG.indexOf(capB);
    }
    function xetNhatXungHaoTinh(capLucHienTai) {
        if (soSanhCap(capLucHienTai,'Tướng') >= 0)
            return { ketLuan:'Ám Động', ghiChu:'Đủ Vượng Tướng bị Nhật xung -> phát động ngầm, không hỏng' };
        if (capLucHienTai === 'Hưu' || capLucHienTai === 'Tù')
            return { ketLuan:'Ám Động Yếu', ghiChu:'Còn chút sức hoạt động, như người ốm vẫn đi lại được' };
        return { ketLuan:'Nhật Phá', ghiChu:'Xung Tán — tan biến, vô dụng' };
    }
    function xetNguyetXungHaoTinh(capLucSauKhiCoDayNeo, coDayNeo) {
        if (!coDayNeo)
            return { ketLuan:'Nguyệt Phá (Thực Phá)', ghiChu:'Không có Hợp/Trực làm dây neo -> Sinh không đủ cứu' };
        if (soSanhCap(capLucSauKhiCoDayNeo,'Tướng') >= 0)
            return { ketLuan:'Bình thường / Ám Động (nếu Trực Nhật)', ghiChu:'Có dây neo + đủ lực -> qua khỏi' };
        if (soSanhCap(capLucSauKhiCoDayNeo,'Hưu') >= 0)
            return { ketLuan:'An toàn nhưng Vô Dụng (Gần)', ghiChu:'Được nuôi nhưng không đủ sức hoạt động trong tháng này; Xa có thể phục hồi' };
        return { ketLuan:'Nguyệt Phá (Thực Phá)', ghiChu:'Dây neo không đủ cứu vì bản thân quá suy' };
    }

    /* ============================================================
       NGUYÊN TẮC 3 (mở rộng) — HÀO BIẾN B CÓ TƯƠNG TÁC ĐƯỢC AI
       ============================================================ */
    function xetTuongTacHaoBien(B, A, tuTri, cacHaoBienKhac) {
        const ketQua = { boNhot:false, voPhuong:false, doiTuongTuongTac: [], ghiChu: [] };

        const boMoTaiTuTri = ['nhat','nguyet','tue','thoi'].some(k => layTruongSinhKhopNen(B.chi, B.hanh, tuTri[k]) === 'Mộ');
        if (boMoTaiTuTri) {
            ketQua.boNhot = true;
            ketQua.ghiChu.push('B đang Mộ tại Tứ Trị, chưa rõ Xung Mộ -> mặc định NHỐT, không tương tác kể cả A.');
            return ketQua;
        }
        const biTuTriApCheNang = ['tue','nguyet','nhat','thoi'].some(k => {
            const q = quanHeMotChieu(tuTri[k], B.chi);
            return q.includes('Khắc') && q.includes('XungKhắc');
        });
        const coHaoBienKhacCuu = (cacHaoBienKhac||[]).some(hb => aSinhB(hb.chi, B.chi) || laLucHop(hb.chi, B.chi));
        if (biTuTriApCheNang && !coHaoBienKhacCuu) {
            ketQua.voPhuong = true;
            ketQua.ghiChu.push('B bị Tứ Trị áp chế nặng, không ai cứu -> VÔ PHƯƠNG tương tác, kể cả A.');
            return ketQua;
        }

        const bienKhacApCheTuongDuong = (cacHaoBienKhac||[]).find(hb =>
            aKhacB(hb.chi, B.chi) && Math.abs(soSanhCap(hb.capLuc, B.capLuc)) <= 1
        );
        const bienKhacBoiDuong = (cacHaoBienKhac||[]).find(hb => aSinhB(hb.chi, B.chi));

        ketQua.doiTuongTuongTac.push({
            doiTuong:'A (Hào Động bản vị)', batBuoc:true,
            loai: aKhacB(B.chi,A.chi) ? 'Hồi đầu Khắc' : (aSinhB(B.chi,A.chi) ? 'Hồi đầu Sinh' : 'Tỷ hòa/khác')
        });

        if (bienKhacApCheTuongDuong) {
            ketQua.ghiChu.push('B bị Hào Biến khác lực tương đương áp chế -> CHỈ đủ tương tác với A.');
            return ketQua;
        }
        if (bienKhacBoiDuong) {
            ketQua.ghiChu.push('B được Hào Biến khác bồi dưỡng -> DƯ LỰC, tương tác nhiều đối tượng (không chia nhỏ lực).');
            ketQua.doiTuongTuongTac.push({ doiTuong:'Hào Biến khác ('+bienKhacBoiDuong.chi+')', batBuoc:false, loai:'Được bồi dưỡng (Sinh)' });
        } else {
            ketQua.ghiChu.push('B ổn định -> vẫn đủ lực vươn ra các hào khác trong Quẻ Chính.');
        }
        return ketQua;
    }

    function nhanChieuSinhDongBien(chiDong, chiBien) {
        if (aSinhB(chiDong, chiBien)) return 'hào Chủ phát Động tiến đến mà Sinh (cát)';
        if (aSinhB(chiBien, chiDong)) return 'Hồi đầu Sinh (cát, Biến quay lại nuôi Động)';
        if (aKhacB(chiDong, chiBien)) return 'hào Chủ phát Động tiến đến mà Khắc';
        if (aKhacB(chiBien, chiDong)) return 'Hồi đầu Khắc (hung, Biến quay lại khắc Động)';
        if (laXung(chiDong, chiBien)) return 'Phục Ngâm/Phản Ngâm (xem có Khắc kèm không)';
        return 'Tỷ hòa / không có tương tác Sinh-Khắc trực tiếp';
    }

    /* ============================================================
       TUẦN KHÔNG — Giả Không / Thật Không
       ============================================================ */
    function xetTuanKhong(chiHao, danhSachTuanKhong, capLucHienTai) {
        if (!danhSachTuanKhong.includes(chiHao)) return null;
        const dungHuuTuTroLen = soSanhCap(capLucHienTai, 'Hưu') >= 0;
        return {
            laTuanKhong: true,
            loai: dungHuuTuTroLen ? 'Giả Không' : 'Thật Không',
            ghiChu: dungHuuTuTroLen
                ? 'Được sinh trợ đủ mạnh -> tạm treo, gặp Xung Không/Điền Thực sẽ phát huy'
                : 'Hưu Tù/Khắc/Nguyệt Phá, không sức -> vô dụng kể cả khi ra khỏi Tuần Không'
        };
    }

    /* ============================================================
       TÍNH TRẠNG THÁI 1 HÀO (TĨNH hoặc bản vị Hào Động)
       ============================================================ */
    function tinhTrangThaiHao(chiHao, tuTri, danhSachHaoDongKhac, danhSachTuanKhong) {
        const hanhHao = NGU_HANH_CUA_CHI[chiHao];
        const muaThamKhao = vuongSuyTheoMua(tuTri.nguyet, hanhHao); // lớp tham khảo phụ

        // Lớp CHÍNH — khớp code nền: VUONG_SUY_TABLE + resolveVuongSuy theo đúng cặp Chi-Chi.
        const vsNhat = layVuongSuyKhopNen(chiHao, tuTri.nhat, "Nhật");
        const vsNguyet = layVuongSuyKhopNen(chiHao, tuTri.nguyet, "Nguyệt");
        const capLucChinh = vsNguyet ? vsNguyet.capLuc : (muaThamKhao || 'Hưu');

        const qhNhat   = quanHeTuTriToiHao(tuTri.nhat,   'Nhật',   chiHao);
        const qhNguyet = quanHeTuTriToiHao(tuTri.nguyet, 'Nguyệt', chiHao);
        const qhTue    = quanHeTuTriToiHao(tuTri.tue,    'Thái Tuế', chiHao);
        const qhThoi   = quanHeTuTriToiHao(tuTri.thoi,   'Thời',   chiHao);

        const tuongTacTuHaoDongKhac = (danhSachHaoDongKhac||[]).map(hd => ({
            tuHao: hd.soHao, chi: hd.chi, tags: quanHeMotChieu(hd.chi, chiHao)
        }));

        const truongSinhTheoNhat = layTruongSinhKhopNen(chiHao, hanhHao, tuTri.nhat);
        const tuanKhong = xetTuanKhong(chiHao, danhSachTuanKhong||[], capLucChinh);

        return {
            chiHao, hanhHao,
            vuongSuyTheoMua: muaThamKhao,
            vuongSuyChinhTheoNhat: vsNhat ? vsNhat.chuoi : null,
            vuongSuyChinhTheoNguyet: vsNguyet ? vsNguyet.chuoi : null,
            capLuc: capLucChinh,
            thienThoi: { Nhật: qhNhat, Nguyệt: qhNguyet, TháiTuế: qhTue, Thời: qhThoi },
            tuongTacTuHaoDongKhac,
            vongTruongSinh: truongSinhTheoNhat,
            tuanKhong,
        };
    }

    /* ============================================================
       TÍNH TRẠNG THÁI HÀO BIẾN (chỉ áp dụng vị trí có Hào Động)
       ============================================================ */
    function tinhTrangThaiHaoBien(chiBien, chiDong, tuTri, danhSachHaoBienKhac, danhSachTuanKhong) {
        const hanhBien = NGU_HANH_CUA_CHI[chiBien];
        const coSo = tinhTrangThaiHao(chiBien, tuTri, [], danhSachTuanKhong);
        const chieuSinhKhac = nhanChieuSinhDongBien(chiDong, chiBien);
        const hoaThoai = THOAI_THAN_MAP[chiDong] === chiBien;

        const capLucUocLuong = coSo.capLuc; // đã lấy đúng từ VUONG_SUY_TABLE khớp code nền

        const tuongTac = xetTuongTacHaoBien(
            { chi: chiBien, hanh: hanhBien, capLuc: capLucUocLuong },
            { chi: chiDong, hanh: NGU_HANH_CUA_CHI[chiDong], capLuc: 'Tướng' },
            tuTri,
            danhSachHaoBienKhac
        );

        return {
            ...coSo,
            laHaoBien: true,
            chiDongSinhRa: chiDong,
            chieuSinhKhacVoiHaoDong: chieuSinhKhac,
            hoaThoaiThan: hoaThoai,
            tuongTacMoRong: tuongTac,
            ghiChuCap: 'Hào Biến nhỉnh hơn Hào Động 1 bậc bẩm sinh (B Hưu Tù ≈ A Tướng) khi so khắc/chế lẫn nhau.'
        };
    }

    /* ============================================================
       HÀM ĐIỀU PHỐI CHÍNH: XỬ LÝ TOÀN BỘ QUẺ
       ============================================================ */
    function phanTichQue(queData) {
        const { tuTri, tuanKhong = [], haoList } = queData;
        const haoDongList = haoList.filter(h => h.isDong).map(h => ({ soHao:h.soHao, chi:h.chi }));
        const haoBienDongList = haoList.filter(h => h.isDong && h.hb).map(h => ({ chi:h.hb.chi, hanh:NGU_HANH_CUA_CHI[h.hb.chi] }));

        const ketQua = haoList.map(hao => {
            const dongKhac = haoDongList.filter(hd => hd.soHao !== hao.soHao);
            const banVi = tinhTrangThaiHao(hao.chi, tuTri, dongKhac, tuanKhong);

            let bien = null;
            if (hao.isDong && hao.hb) {
                const bienKhac = haoBienDongList.filter(hb => hb.chi !== hao.hb.chi);
                bien = tinhTrangThaiHaoBien(hao.hb.chi, hao.chi, tuTri, bienKhac, tuanKhong);
            }

            let phucThan = null;
            if (hao.phucThan) {
                const quanHePhiPhuc = quanHeMotChieu(hao.chi, hao.phucThan.chi);
                phucThan = {
                    ...tinhTrangThaiHao(hao.phucThan.chi, tuTri, dongKhac, tuanKhong),
                    laPhucThan: true,
                    phiThanChi: hao.chi,
                    quanHePhiThan: quanHePhiPhuc,
                };
            }

            return {
                soHao: hao.soHao, lucThan: hao.lucThan, theUng: hao.theUng || null,
                chi: hao.chi, isDong: !!hao.isDong,
                banVi, bien, phucThan,
            };
        });

        return {
            tuTri, tuanKhong, ketQuaTungHao: ketQua,
            ghiChuChung: [
                'Kết quả THÔ (R1 + khung R2.1/R2.2 rút gọn) — liệt kê đầy đủ dữ kiện khách quan, KHÔNG tự rút gọn về 1 kết luận duy nhất khi có nhiều case cùng áp dụng.',
                'Gần/Xa (C-MR của R2.2), Nhập Mộ/Xuất Mộ chi tiết (R3), Tuần Không nâng cao (R2.3), và Lục Thân Thật/Giả cần xử lý thêm ở module kế tiếp.',
            ]
        };
    }

    const LucHaoTrangThai = {
        phanTichQue, tinhTrangThaiHao, tinhTrangThaiHaoBien, xetTuongTacHaoBien,
        nhanChieuSinhDongBien, quanHeMotChieu, xetTrucLam, xetVongTruongSinh,
        vuongSuyTheoMua, xetTuanKhong, timTamHopCuc, xetNhatXungHaoTinh, xetNguyetXungHaoTinh,
    };
    window.LucHaoTrangThai = LucHaoTrangThai;

    /* ============================================================
       LỚP GHÉP NỐI VỚI CODE NỀN + m01.js + UI (moduleSlot)
       ============================================================ */
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
    function layTuanKhongTuM01() {
        const c1 = document.getElementById("m01_tkChi1");
        const c2 = document.getElementById("m01_tkChi2");
        return [c1 ? c1.value : "", c2 ? c2.value : ""].filter(Boolean);
    }
    function tachLucThanTuChuoi(napString) {
        const clean = napString.replace(/\(Thế\)|\(Ứng\)/g, "").trim();
        const words = clean.split(/\s+/);
        return words.slice(0, -2).join(" ");
    }
    function layPhucThanTuM01(haoSo) {
        const el = document.getElementById("m01_pt" + haoSo);
        if (!el || !el.value.trim()) return null;
        const val = el.value.trim();
        if (typeof getChiHanh !== "function") return null;
        const chiHanh = getChiHanh(val);
        const chi = chiHanh.split(" ")[0];
        return { chi, lucThan: tachLucThanTuChuoi(val) };
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
            const lucThan = tachLucThanTuChuoi(nap);
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

            haoList.push({ soHao: h, chi, lucThan, theUng, isDong, hb, phucThan: layPhucThanTuM01(h) });
        }
        return haoList;
    }

    function ghiTag(tags) { return (tags && tags.length) ? tags.join(", ") : "(không có)"; }

    function dinhDangMotHaoTrangThai(nhan, tt) {
        let s = "";
        s += `  ${nhan}: ${tt.chiHao} (${tt.hanhHao})\n`;
        s += `    Vượng Suy chính — Nhật: ${tt.vuongSuyChinhTheoNhat || "?"} | Nguyệt: ${tt.vuongSuyChinhTheoNguyet || "?"} -> Cấp lực dùng để xét case: ${tt.capLuc}\n`;
        s += `    (Tham khảo theo mùa Nguyệt Lệnh: ${tt.vuongSuyTheoMua || "?"})\n`;
        s += `    Trường Sinh theo Nhật: ${tt.vongTruongSinh || "?"}\n`;
        s += `    Với Nhật: Trực/Lâm=${tt.thienThoi.Nhật.trucLam || "không"}, quan hệ=${ghiTag(tt.thienThoi.Nhật.tags)}\n`;
        s += `    Với Nguyệt: Trực/Lâm=${tt.thienThoi.Nguyệt.trucLam || "không"}, quan hệ=${ghiTag(tt.thienThoi.Nguyệt.tags)}\n`;
        s += `    Với Thái Tuế: Trực/Lâm=${tt.thienThoi.TháiTuế.trucLam || "không"}, quan hệ=${ghiTag(tt.thienThoi.TháiTuế.tags)}\n`;
        s += `    Với Thời: Trực/Lâm=${tt.thienThoi.Thời.trucLam || "không"}, quan hệ=${ghiTag(tt.thienThoi.Thời.tags)}\n`;
        if (tt.tuongTacTuHaoDongKhac && tt.tuongTacTuHaoDongKhac.length) {
            tt.tuongTacTuHaoDongKhac.forEach(tk => {
                s += `    Hào Động ${tk.tuHao} (${tk.chi}) tác động: ${ghiTag(tk.tags)}\n`;
            });
        }
        if (tt.tuanKhong) {
            s += `    *** TUẦN KHÔNG: ${tt.tuanKhong.loai} — ${tt.tuanKhong.ghiChu}\n`;
        }
        if (tt.laHaoBien) {
            s += `    [Hào Biến do Hào ${tt.chiDongSinhRa} Động hóa ra] Chiều Sinh-Khắc với Động: ${tt.chieuSinhKhacVoiHaoDong}\n`;
            s += `    Hóa Thoái Thần: ${tt.hoaThoaiThan ? "CÓ" : "không"}\n`;
            const tu = tt.tuongTacMoRong;
            if (tu.boNhot) s += `    -> BỊ NHỐT (Mộ tại Tứ Trị, chưa rõ Xung Mộ): ${tu.ghiChu.join(" ")}\n`;
            else if (tu.voPhuong) s += `    -> VÔ PHƯƠNG tương tác: ${tu.ghiChu.join(" ")}\n`;
            else {
                s += `    -> Đối tượng có thể tương tác: ${tu.doiTuongTuongTac.map(d => `${d.doiTuong} (${d.loai})`).join("; ")}\n`;
                s += `    ${tu.ghiChu.join(" ")}\n`;
            }
        }
        if (tt.laPhucThan) {
            s += `    [Phục Thần dưới Phi Thần ${tt.phiThanChi}] Quan hệ Phi->Phục: ${ghiTag(tt.quanHePhiThan)}\n`;
        }
        return s;
    }

    function dinhDangKetQua(kq) {
        let text = "=== MODULE 4 — TRẠNG THÁI CÁC HÀO (Tĩnh/Động/Biến/Phục Thần) ===\n";
        text += `Tứ Trị: Thời=${kq.tuTri.thoi || "?"}  Nhật=${kq.tuTri.nhat || "?"}  Nguyệt=${kq.tuTri.nguyet || "?"}  Thái Tuế=${kq.tuTri.tue || "?"}\n`;
        text += `Tuần Không đang xét: ${kq.tuanKhong.length ? kq.tuanKhong.join(", ") : "(không có)"}\n\n`;

        kq.ketQuaTungHao.forEach(h => {
            text += `--- Hào ${h.soHao}${h.theUng ? " (" + h.theUng + ")" : ""}: ${h.lucThan} ${h.chi} — ${h.isDong ? "ĐỘNG" : "Tĩnh"} ---\n`;
            text += dinhDangMotHaoTrangThai("Bản vị", h.banVi);
            if (h.bien) text += dinhDangMotHaoTrangThai("Hào Biến", h.bien);
            if (h.phucThan) text += dinhDangMotHaoTrangThai("Phục Thần", h.phucThan);
            text += "\n";
        });

        text += "Ghi chú chung:\n" + kq.ghiChuChung.map(g => "- " + g).join("\n") + "\n";
        text += "=== HẾT MODULE 4 — TRẠNG THÁI CÁC HÀO ===";
        return text;
    }

    const boxHtml = `
        <div class="header" style="border-bottom: 1px solid var(--gold); padding: 5px 0 10px 0; margin-bottom: 15px;">
            <h1 style="font-size: 1.1rem;">Module 4 — Trạng Thái Các Hào</h1>
        </div>
        <p style="font-size:0.72rem;color:#888;margin:0 0 12px;">
            Tự lấy Tứ Trị (Thời/Nhật/Nguyệt/Thái Tuế) từ box Tứ Trị phía trên, Tuần Không +
            Phục Thần từ Module 1 (Tuần Không) — điền các box đó trước khi bấm nút dưới đây.
        </p>
        <button class="m-btn-process" id="m04_xuLyBtn">⚙️ XỬ LÝ TRẠNG THÁI CÁC HÀO</button>
        <textarea id="m04_output" class="m-output-box" readonly></textarea>
        <button class="btn-copy" id="m04_copyBtn" style="display:none;">📋 SAO CHÉP KẾT QUẢ TRẠNG THÁI HÀO</button>
        <div class="fallback-box" id="m04_fallbackBox">
            <textarea id="m04_fallbackText" readonly></textarea>
            <div class="fallback-hint">Trình duyệt chặn copy tự động — bấm vào ô trên để chọn hết rồi copy thủ công (Ctrl+C / giữ để copy)</div>
        </div>
    `;
    const box = moduleSlot(boxHtml);
    const $ = (id) => box.querySelector("#" + id);
    $("m04_output").addEventListener("click", function () { this.select(); });
    $("m04_fallbackText").addEventListener("click", function () { this.select(); });

    function xuLy() {
        const tuTri = layTuTriTuCoreDOM();
        if (!tuTri.nhat || !tuTri.nguyet) {
            alert("Vui lòng nhập đủ Nhật Thần và Nguyệt Lệnh ở box Tứ Trị (phía trên) trước.");
            return;
        }
        const haoList = layHaoListTuCoreDOM();
        if (!haoList) {
            alert("Vui lòng chọn Họ Quẻ và Tên Quẻ Chủ ở phần trên trước.");
            return;
        }
        const tuanKhong = layTuanKhongTuM01();

        const ketQua = phanTichQue({ tuTri, tuanKhong, haoList });
        const text = dinhDangKetQua(ketQua);

        const outputEl = $("m04_output");
        outputEl.value = text;
        outputEl.style.display = "block";
        $("m04_copyBtn").style.display = "block";
        $("m04_fallbackBox").style.display = "none";
    }

    function copyKetQua() {
        const text = $("m04_output").value;
        if (!text) return;
        function showSuccess() {
            const btn = $("m04_copyBtn");
            $("m04_fallbackBox").style.display = "none";
            btn.innerText = "✅ ĐÃ SAO CHÉP!";
            setTimeout(() => { btn.innerText = "📋 SAO CHÉP KẾT QUẢ TRẠNG THÁI HÀO"; }, 2000);
        }
        function showFallback() {
            const fbBox = $("m04_fallbackBox");
            const ta = $("m04_fallbackText");
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

    $("m04_xuLyBtn").addEventListener("click", xuLy);
    $("m04_copyBtn").addEventListener("click", copyKetQua);

})();
