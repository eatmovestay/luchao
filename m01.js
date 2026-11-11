/* =========================================================================
 * m01.js — MODULE 1: TUẦN KHÔNG (Kinh Dịch Lục Hào)
 * Tự tạo UI của nó qua moduleSlot() (định nghĩa sẵn trong total.html) và
 * dùng lại toàn bộ hàm/biến nền đã có trong total.html:
 *   dataDich, getChiHanh, getHanh, tinhLucThan, findQueByCode,
 *   selectedDong, bienQueGiam, VUONG_SUY_TABLE, resolveVuongSuy, getTruongSinh
 * Toàn bộ biến/hàm RIÊNG của module này được bọc trong 1 IIFE để KHÔNG tràn
 * ra global — tránh đụng tên với các module mXX.js khác sau này. Chỉ cố ý
 * public đúng 1 thứ: window.TuanKhongModule (để module sau có thể tái dùng
 * case-logic Tuần Không nếu cần), y như bản nhúng trước đây.
 * ========================================================================= */
(function () {
    "use strict";

    /* ------------------------------------------------------------------
     * BẢNG TRA DÙNG RIÊNG CHO MODULE NÀY (không khai báo global ngoài IIFE)
     * ------------------------------------------------------------------ */
    const DIA_CHI = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
    const THIEN_CAN = ['Giáp','Ất','Bính','Đinh','Mậu','Kỷ','Canh','Tân','Nhâm','Quý'];

    const CHI_HANH_MAP = {
        "Tý":"Thủy","Sửu":"Thổ","Dần":"Mộc","Mão":"Mộc","Thìn":"Thổ","Tỵ":"Hỏa",
        "Ngọ":"Hỏa","Mùi":"Thổ","Thân":"Kim","Dậu":"Kim","Tuất":"Thổ","Hợi":"Thủy"
    };
    const CHI_XUNG_MAP = {
        "Tý":"Ngọ","Ngọ":"Tý","Sửu":"Mùi","Mùi":"Sửu","Dần":"Thân","Thân":"Dần",
        "Mão":"Dậu","Dậu":"Mão","Thìn":"Tuất","Tuất":"Thìn","Tỵ":"Hợi","Hợi":"Tỵ"
    };
    const CHI_LUCHOP_MAP = {
        "Tý":"Sửu","Sửu":"Tý","Dần":"Hợi","Hợi":"Dần","Mão":"Tuất","Tuất":"Mão",
        "Thìn":"Dậu","Dậu":"Thìn","Tỵ":"Thân","Thân":"Tỵ","Ngọ":"Mùi","Mùi":"Ngọ"
    };
    const HANH_SINH_MAP = { "Kim":"Thủy","Thủy":"Mộc","Mộc":"Hỏa","Hỏa":"Thổ","Thổ":"Kim" };
    const HANH_KHAC_MAP = { "Kim":"Mộc","Mộc":"Thổ","Thổ":"Thủy","Thủy":"Hỏa","Hỏa":"Kim" };

    // Phạm vi ảnh hưởng theo Lục Thân — dùng để diễn giải hào Tuần Không ảnh hưởng mảng nào.
    const LUC_THAN_PHAM_VI = {
        "Thê Tài": "Tài Vận (tiền bạc, tài sản, kinh doanh; vợ/người yêu với nam mệnh)",
        "Tử Tôn": "Sức Khỏe / Phước Lực (con cái, thầy thuốc, giải hạn, may mắn hoá giải)",
        "Phụ Mẫu": "Văn Thư / Giấy Tờ / Bề Trên (nhà cửa, xe cộ, hợp đồng, cha mẹ, người bảo trợ, cấp trên)",
        "Quan Quỷ": "Bệnh Tật / Chức Vụ / Chồng / Đối Thủ / Hoạ Nạn (công danh, thi cử; chồng với nữ mệnh; tiểu nhân, tai ương)",
        "Huynh Đệ": "Anh Chị Em / Người Cạnh Tranh / Bạn Bè Giao Tế (hao tài, cạnh tranh, quan hệ ngang hàng)"
    };

    function idxChi(chi) {
        const i = DIA_CHI.indexOf(chi);
        if (i === -1) throw new Error(`Địa Chi không hợp lệ: ${chi}`);
        return i;
    }
    function idxCan(can) {
        const i = THIEN_CAN.indexOf(can);
        if (i === -1) throw new Error(`Thiên Can không hợp lệ: ${can}`);
        return i;
    }

    /* ------------------------------------------------------------------
     * 1. TÍNH TUẦN KHÔNG
     * ------------------------------------------------------------------ */
    function tinhTuanKhong(can, chi) {
        const canIdx = idxCan(can);
        const chiIdx = idxChi(chi);
        const xunStart = (chiIdx - canIdx + 12) % 12;
        const khong1 = DIA_CHI[(xunStart + 10) % 12];
        const khong2 = DIA_CHI[(xunStart + 11) % 12];
        return [khong1, khong2];
    }
    function chiCoTuanKhong(chi, tuanKhongPair) {
        return tuanKhongPair.includes(chi);
    }

    /* ------------------------------------------------------------------
     * 2. CASE TĨNH
     * ------------------------------------------------------------------ */
    function xetTinhTuanKhong(p) {
        const ketQua = [];

        if (p.loaiViec === 'nhanSu') {
            ketQua.push({
                case: 'TINH_NHAN_SU',
                ghiChu: 'Tuần Không ở Nhân sự luôn báo lòng người không thật, bất kể Dụng vượng hay suy.',
                luuY: 'Quẻ đơn giản (1 Thế 1 Dụng): Dụng không = người không thật; Thế không = bản thân không đủ năng lực/mất phương hướng (không phải giả). Quẻ phức hợp: cần vị trí hào + ngũ hành + Lục Thần để phân biệt ai thật/ai không.'
            });
            return ketQua;
        }

        const vuong = p.vuongSuy === 'Vuong' || p.vuongSuy === 'Tuong';

        if (vuong) {
            if (p.suKienCoDinh) {
                ketQua.push({
                    case: 'TINH_TAIVAT_VUONG_CODINH',
                    ketLuan: p.daQuaMocXungThuc ? 'THANH' : 'HONG',
                    ghiChu: 'Vượng + sự việc có mốc cố định: trước mốc xung/thực Không = hỏng; qua mốc mới tính.'
                });
            } else {
                ketQua.push({
                    case: 'TINH_TAIVAT_VUONG_LUUDONG',
                    ketLuan: p.daQuaMocXungThuc ? 'THANH' : 'HONG',
                    ghiChu: 'Vượng + sự việc lưu động: chỉ THÀNH đúng lúc mốc xung/thực Không; trước đó vứt cả.'
                });
            }
        } else {
            ketQua.push({
                case: 'TINH_TAIVAT_HUUSUY',
                ketLuan: 'HONG',
                chanKhong: true,
                ungKy: 'Lúc xung/thực Không (chỉ để đối chiếu thời điểm, không phải để cứu)',
                ghiChu: 'Hưu/Suy + Tuần Không = chân không, hỏng hẳn bất cứu.'
            });
        }

        if (p.coMo) {
            if (p.coHaoDongSinh) {
                ketQua.push({
                    case: 'TINH_MO_NGOAILE_HAODONG_SINH',
                    ketLuan: 'THANH',
                    ungKy: 'Lúc thực Không',
                    ghiChu: 'NGOẠI LỆ không theo công thức chung: có hào Động sinh cho hào Tuần Không → chính lúc thực Không lại là lúc việc THÀNH.'
                });
            } else {
                ketQua.push({
                    case: 'TINH_MO_MAC_DINH',
                    ketLuan: 'HONG',
                    ghiChu: 'Tuần Không dù Vượng vẫn sợ Mộ — có Mộ là hỏng ngay (trừ ngoại lệ có hào Động sinh ở trên).'
                });
            }
        }

        if (p.laKinhDoanh) {
            ketQua.push({
                case: 'TINH_KINHDOANH_TAIKHONG',
                tuong: 'Bị trộm (không nhất thiết là nhân viên)',
                ghiChu: 'Tài tuần không trong bối cảnh kinh doanh mang tượng thất thoát/bị lấy mất.'
            });
        }

        return ketQua;
    }

    function xetKyThanTriTheKhong(p) {
        if (!p.ungKyDungTruocKyThan) {
            return { case: 'KYTHAN_TRI_THE_KHONG', apDung: false, ghiChu: 'Chỉ áp dụng khi ứng kỳ Dụng đến trước ứng kỳ Kỵ thần (thực Không).' };
        }
        const base = {
            case: 'KYTHAN_TRI_THE_KHONG',
            apDung: true,
            dienBien: 'Việc thoạt thành lúc ứng kỳ Dụng, nhưng đến lúc thực Thế (Kỵ thần phát) thì mất.'
        };
        if (p.loaiDungThan === 'Phu') {
            return { ...base, ketLuan: 'Xin việc: chỉ được nhận thử việc, không chính thức.' };
        }
        if (p.loaiDungThan === 'Quan') {
            return {
                ...base,
                ketLuan: 'Được nhận chức, NHƯNG nguy hiểm hơn Phụ/Tài: bản thân gặp tai nạn tại ứng kỳ hào Tử.',
                canhBao: true
            };
        }
        return { ...base, ketLuan: 'Việc liên quan Tài: thoạt được rồi mất tại ứng kỳ thực Thế.' };
    }

    /* ------------------------------------------------------------------
     * 3. CASE ĐỘNG
     * ------------------------------------------------------------------ */
    function xetDongTuanKhong(p) {
        const ketQua = [{
            case: 'DONG_TUAN_KHONG_CO_BAN',
            ghiChu: 'Hào Động tuần không (hoặc Nguyệt Phá mà Động) KHÔNG còn coi là tuần không nữa; có ứng kỳ RIÊNG tại lúc xung/thực, không dời sang chi khác.'
        }];

        if (p.gapMoBien) {
            ketQua.push({
                case: 'DONG_NGOAILE_GAP_MO_BIEN',
                ketLuan: 'HONG',
                ghiChu: 'Ngoại lệ tuyệt đối: hào động tuần không mà gặp Mộ biến (Nhật xung hoặc hào động hóa Mộ) thì dù vượng cỡ nào việc vẫn hỏng.'
            });
            return ketQua;
        }

        ketQua.push({
            case: 'DONG_KHOP_DIEM_XUNG_THUC',
            ketLuan: p.soDiemDaKhop >= p.soDiemCanKhop ? 'CO_THE_THANH' : 'CHUA_DU_DIEU_KIEN',
            ghiChu: p.suKienCoDinh
                ? `Sự việc cố định: chỉ khi khớp đủ ${p.soDiemCanKhop} điểm xung/thực mới có tác động thật.`
                : 'Sự việc không cố định: hào động chỉ báo hiệu, chưa cần khớp đủ điểm mới có ý nghĩa.'
        });

        return ketQua;
    }

    function xetChuoiDongBienTuanKhong(p) {
        if (!p.aVaBDeuKhong) {
            return { case: 'CHUOI_AB_KHONG_AP_DUNG', ghiChu: 'Case này chỉ áp dụng khi cả A và B đều tuần không.' };
        }
        if (p.vaiTroA === 'KyThan' && !p.bKhacA) {
            return {
                case: 'CHUOI_KYTHAN_KHONGBI_BKHAC',
                ungKy: 'Lúc xung/thực Không',
                ghiChu: 'A là Kỵ thần, không bị Nhật xung → ứng kỳ hào Dụng bị khắc rơi đúng lúc xung/thực Không.'
            };
        }
        if (p.vaiTroA === 'KyThan' && p.bKhacA) {
            return {
                case: 'CHUOI_KYTHAN_BI_BKHAC',
                dienBien: 'Trước mốc xung/thực: Dụng thần vẫn bị khắc/tổn thương liên tục.',
                ketLuan: 'Đến đúng mốc xung/thực mới chấm dứt bị khắc — nếu việc theo thời điểm, đó là lúc việc THÀNH.',
                ghiChu: 'B khắc lại A → mốc xung/thực là điểm Kỵ thần A bị khắc, giải thoát cho Dụng.'
            };
        }
        if (p.vaiTroA === 'NguyenThan' && !p.bKhacA) {
            return {
                case: 'CHUOI_NGUYENTHAN_KHONGBI_BKHAC',
                ungKy: 'Lúc xung/thực Không',
                ghiChu: 'A là Nguyên thần → chỉ lúc xung/thực Không, Nguyên thần mới thật sự sinh được cho Dụng.'
            };
        }
        if (p.vaiTroA === 'NguyenThan' && p.bKhacA) {
            return {
                case: 'CHUOI_NGUYENTHAN_BI_BKHAC',
                dienBien: 'Trước mốc xung/thực: Nguyên thần vẫn sinh cho Dụng bình thường.',
                ketLuan: 'Đến đúng mốc xung/thực thì sinh chấm dứt.',
                ungDung: 'Nếu việc có thể chọn thời điểm hành động → làm TRƯỚC mốc xung/thực sẽ THÀNH.'
            };
        }
        return { case: 'CHUOI_AB_KHONG_XAC_DINH', ghiChu: 'Không khớp case nào trong 4 case chuẩn — cần rà lại tham số.' };
    }

    /* ------------------------------------------------------------------
     * 4. MỘ
     * ------------------------------------------------------------------ */
    function xacDinhMoKhiTuanKhong(p) {
        if (p.laMo && (p.laTuanKhong || p.hoaTuanKhong)) {
            return {
                case: 'MO_BI_TUAN_KHONG_HUY',
                laMo: false,
                ghiChu: 'Mộ + Tuần Không (Động là Mộ nhưng không / Biến là Mộ nhưng không / Động là Mộ nhưng hóa không) → KHÔNG tính là Mộ.',
                luuY: 'Lúc xung/thực chỉ tính hóa TIẾT (thoát), không tính hóa Mộ trở lại.'
            };
        }
        return { case: 'MO_BINH_THUONG', laMo: p.laMo };
    }

    function xetTaiHoaPhu(p) {
        if (p.oHaoThe && p.hoiXinViec) {
            return { case: 'TAI_HOA_PHU_O_THE_XINVIEC', ketLuan: 'Được nhận thử việc, không chính thức.' };
        }
        return { case: 'TAI_HOA_PHU_KHONG_O_THE', ketLuan: 'Báo việc dùng tiền mà thành (không liên quan chính thức hóa công việc).' };
    }

    function xetMoVsNguyetPha(p) {
        const ketQua = [];
        if (p.chinhHaoMoBiNhatXung) {
            ketQua.push({ case: 'MO_BI_NHAT_XUNG_TRUC_TIEP', laMo: false, ghiChu: 'Nhật xung thẳng vào hào Mộ → không tính Mộ VĨNH VIỄN.' });
        }
        if (p.bienHaoBiNhatXung && !p.chinhHaoMoBiNhatXung) {
            ketQua.push({ case: 'MO_CO_BIEN_BI_NHAT_XUNG', ghiChu: 'Hào Động là Mộ nhưng chính hào Biến của nó (không phải hào Mộ) bị Nhật xung → KHÔNG áp dụng quy tắc "mất Mộ vĩnh viễn" ở trên; cần xét riêng theo case cụ thể.' });
        }
        if (p.hoaKhacHoacSuy) {
            ketQua.push({ case: 'MO_HOA_KHAC_HOAC_SUY', laMo: false, ghiChu: 'Hào Mộ hóa Khắc hoặc hóa Suy (kể cả qua hào Biến) → không tính Mộ.' });
        }
        if (p.moMaHuu) {
            ketQua.push({
                case: 'MO_MA_HUU', laMo: true,
                ungKy: 'Lúc hào Biến khắc lại hào Mộ',
                ghiChu: 'Mộ mà Hưu vẫn tính là Mộ thật.'
            });
        }
        if (p.laNguyenThan && p.biKhac) {
            ketQua.push({
                case: 'NGUYENTHAN_LA_MO_BI_KHAC', laMo: false,
                ghiChu: 'NGOẠI LỆ ngược trực giác: Nguyên thần là Mộ mà bị khắc → vẫn tính KHÔNG phải Mộ (khác xử lý Nguyên thần bị khắc thông thường — cần đặc biệt lưu ý tránh luận sai).'
            });
        }
        return ketQua;
    }

    /* ------------------------------------------------------------------
     * 5. TUẦN KHÔNG LÂM NGUYỆT
     * ------------------------------------------------------------------ */
    function xetTuanKhongLamNguyet(p) {
        if (!p.daQuaThangCuaChiKhong) {
            if (!p.cucDaHinhThanh) {
                return { nhanh: 1, chang: 1, ketLuan: 'THANH', ghiChu: 'Cục chưa hình thành, hào liên quan trơ trọi/hỏng, nhưng hào chủ đạo còn Nguyệt Phá chưa tới mốc → lấy ngược.' };
            }
            if (p.cucDaHinhThanh && p.theConNguyetPha) {
                return { nhanh: 1, chang: 2, ketLuan: 'BAT_THANH', ghiChu: 'Cục đã hình thành (giả định cho THÀNH) nhưng hào chủ đạo vẫn còn Nguyệt Phá → lấy ngược thành Bất Thành.' };
            }
            return { nhanh: 1, chang: 3, ketLuan: 'THANH', ghiChu: 'Đủ mặt, hào chủ đạo đã thoát Nguyệt Phá → xét bình thường.' };
        }
        if (p.theConNguyetPha && !p.daToiThangThoatPha) {
            return { nhanh: 2, chang: 1, ketLuan: 'THANH', ghiChu: 'Hào chủ đạo còn Nguyệt Phá chưa tới mốc thoát → lấy ngược.' };
        }
        return { nhanh: 2, chang: 2, ketLuan: 'THANH', ghiChu: 'Đã qua mốc thoát Nguyệt Phá → xét bình thường.' };
    }

    /* ------------------------------------------------------------------
     * 6. HÀM TỔNG HỢP GỐC
     * ------------------------------------------------------------------ */
    function phanTichTuanKhong(hao, context) {
        const tuanKhongPair = tinhTuanKhong(context.canNgay, context.chiNgay);
        const laTuanKhong = chiCoTuanKhong(hao.chi, tuanKhongPair);
        const ketQua = { hao: hao.chi, tuanKhongPair, laTuanKhong, caseApDung: [] };
        if (!laTuanKhong) return ketQua;

        if (hao.laTinh) {
            ketQua.caseApDung.push(...xetTinhTuanKhong(hao));
            if (hao.kyThanTriThe) ketQua.caseApDung.push(xetKyThanTriTheKhong(hao.kyThanTriThe));
        } else {
            ketQua.caseApDung.push(...xetDongTuanKhong(hao));
            if (hao.chuoiDongBien) ketQua.caseApDung.push(xetChuoiDongBienTuanKhong(hao.chuoiDongBien));
        }
        if (hao.moParams) ketQua.caseApDung.push(xacDinhMoKhiTuanKhong(hao.moParams));
        if (hao.taiHoaPhuParams) ketQua.caseApDung.push(xetTaiHoaPhu(hao.taiHoaPhuParams));
        if (hao.moVsPhaParams) ketQua.caseApDung.push(...xetMoVsNguyetPha(hao.moVsPhaParams));
        if (hao.khongLamNguyetParams) ketQua.caseApDung.push(xetTuanKhongLamNguyet(hao.khongLamNguyetParams));
        return ketQua;
    }

    const TuanKhongModule = {
        tinhTuanKhong, chiCoTuanKhong, xetTinhTuanKhong, xetKyThanTriTheKhong,
        xetDongTuanKhong, xetChuoiDongBienTuanKhong, xacDinhMoKhiTuanKhong,
        xetTaiHoaPhu, xetMoVsNguyetPha, xetTuanKhongLamNguyet, phanTichTuanKhong
    };
    // Public có chủ đích — để module số khác (Mộ, Nguyệt Phá...) tái dùng nếu cần.
    window.TuanKhongModule = TuanKhongModule;

    /* ------------------------------------------------------------------
     * LỚP MỞ RỘNG: Hào Động / Nhật / Nguyệt tương tác lên hào Tuần Không
     * (Thổ xung Thổ = Ám Động chứ không Phá; Hợp = neo giữ tốt; lực Hào Động
     * chấm điểm theo Vượng Suy với Nhật/Nguyệt — dùng lại VUONG_SUY_TABLE +
     * resolveVuongSuy của code nền; hào Động hóa Biến cũng gặp Không thì chờ
     * đúng thời điểm mới Thực Không.)
     * ------------------------------------------------------------------ */
    function layLucThan(napString) {
        let clean = napString.replace(/\(Thế\)|\(Ứng\)/g, "").trim();
        let words = clean.split(/\s+/);
        return words.slice(0, -2).join(" ");
    }

    function xetQuanHeTruVoiHaoKhong(chiKhong, chiTru, tenTru, truLamNhapMo) {
        const ketQua = [];
        if (!chiTru || !VUONG_SUY_TABLE[chiKhong] || !VUONG_SUY_TABLE[chiKhong][chiTru]) return ketQua;

        const raw = VUONG_SUY_TABLE[chiKhong][chiTru];
        const trangThai = resolveVuongSuy(raw, tenTru);
        const hanhKhong = CHI_HANH_MAP[chiKhong];
        const hanhTru = CHI_HANH_MAP[chiTru];
        const coXung = CHI_XUNG_MAP[chiKhong] === chiTru;
        const coHop = CHI_LUCHOP_MAP[chiKhong] === chiTru;
        const laVuong = raw.includes("Vượng") || raw.includes("Tướng");

        if (coHop) {
            ketQua.push({
                case: `TK_HOP_${tenTru.toUpperCase()}`,
                ghiChu: `Hào Tuần Không (${chiKhong}) Lục Hợp với ${tenTru} (${chiTru}) → được neo giữ, một điểm tốt cho hào Tuần Không.`
            });
        }

        if (coXung) {
            if (hanhKhong === "Thổ" && hanhTru === "Thổ") {
                if (laVuong) {
                    ketQua.push({
                        case: `TK_THO_XUNG_THO_AMDONG_${tenTru.toUpperCase()}`,
                        ketLuan: "AM_DONG",
                        ghiChu: `${tenTru} (${chiTru}) xung Hào Tuần Không (${chiKhong}), nhưng cả 2 đều hành Thổ nên KHÔNG tính là Phá — Thổ xung Thổ làm TĂNG lực nhau. Trạng thái: ${trangThai} → hào Tuần Không thực chất là ÁM ĐỘNG (ngầm động, có biểu lộ ẩn không lộ ra ngoài), không suy yếu như xung khác hành.`
                    });
                } else {
                    ketQua.push({
                        case: `TK_THO_XUNG_THO_CHUA_RO_${tenTru.toUpperCase()}`,
                        ghiChu: `${tenTru} (${chiTru}) xung Hào Tuần Không (${chiKhong}), cùng hành Thổ nên tăng lực nhau, nhưng chưa ở trạng thái Vượng (${trangThai}) nên chưa đủ căn cứ kết luận Ám Động — cần xét thêm.`
                    });
                }
            } else {
                ketQua.push({
                    case: `TK_XUNG_PHA_${tenTru.toUpperCase()}`,
                    ketLuan: "THOAT_KHONG",
                    ghiChu: `${tenTru} (${chiTru}) xung Hào Tuần Không (${chiKhong}) — khác hành (${hanhTru} xung ${hanhKhong}) nên tán khí thật sự: hào Tuần Không THOÁT KHỎI Tuần Không (thực Không / Phá).`
                });
            }
        } else if (!coHop) {
            ketQua.push({
                case: `TK_TRANGTHAI_${tenTru.toUpperCase()}`,
                ghiChu: `Trạng thái Hào Tuần Không (${chiKhong}) so với ${tenTru} (${chiTru}): ${trangThai}.`
            });
        }

        if (truLamNhapMo) {
            ketQua.push({
                case: `TK_${tenTru.toUpperCase()}_LAM_NHAP_MO`,
                ghiChu: `${tenTru} khai báo làm Hào Tuần Không (${chiKhong}) nhập Mộ — kết hợp với case MO_BI_TUAN_KHONG_HUY ở phần case Tĩnh: Mộ + Tuần Không thường KHÔNG tính là Mộ, trừ khi có hào Động khác sinh cho hào này.`
            });
        }

        return ketQua;
    }

    function danhGiaLucHaoDong(hanhHaoDong, hanhNhat, hanhNguyet) {
        function diem(hanhTru) {
            if (!hanhTru) return 0;
            if (HANH_SINH_MAP[hanhTru] === hanhHaoDong) return 1;
            if (hanhTru === hanhHaoDong) return 1;
            if (HANH_KHAC_MAP[hanhTru] === hanhHaoDong) return -1;
            return 0;
        }
        const diemNhat = diem(hanhNhat);
        const diemNguyet = diem(hanhNguyet);
        const tong = diemNhat + diemNguyet;
        return { diemNhat, diemNguyet, tong, ketLuan: tong > 0 ? "Vượng (đủ lực)" : (tong < 0 ? "Nhược (không đủ lực)" : "Bình hòa") };
    }

    function xetHaoDongTuongTac(chiKhong, haoDongSo, haoDongChi, quanHe, chiNhat, chiNguyet) {
        const ketQua = [];
        if (!haoDongSo || !quanHe || !haoDongChi) return ketQua;

        const hanhHaoDong = CHI_HANH_MAP[haoDongChi];
        const danhGia = danhGiaLucHaoDong(hanhHaoDong, CHI_HANH_MAP[chiNhat], CHI_HANH_MAP[chiNguyet]);

        if (quanHe === "khac") {
            ketQua.push({
                case: "TK_HAODONG_KHAC",
                ketLuan: danhGia.tong > 0 ? "KHAC_CO_HIEU_LUC" : "KHAC_BAT_LUC",
                ghiChu: `Hào Động ${haoDongSo} (${haoDongChi}) khắc Hào Tuần Không (${chiKhong}). Lực Hào Động: được Nhật ${danhGia.diemNhat > 0 ? "trợ" : (danhGia.diemNhat < 0 ? "khắc" : "không trợ không khắc")}, được Nguyệt ${danhGia.diemNguyet > 0 ? "trợ" : (danhGia.diemNguyet < 0 ? "khắc" : "không trợ không khắc")} → ${danhGia.ketLuan}.`
            });
        } else if (quanHe === "sinh") {
            ketQua.push({
                case: "TK_HAODONG_SINH",
                ghiChu: `Hào Động ${haoDongSo} (${haoDongChi}) sinh cho Hào Tuần Không (${chiKhong}) — nếu Hào Tuần Không đồng thời là Mộ, đây là NGOẠI LỆ (case TINH_MO_NGOAILE_HAODONG_SINH): chính lúc thực Không lại là lúc việc THÀNH.`
            });
        } else if (quanHe === "nhapMo") {
            ketQua.push({
                case: "TK_HAODONG_NHAP_MO",
                ghiChu: `Hào Động ${haoDongSo} (${haoDongChi}) làm Hào Tuần Không (${chiKhong}) nhập Mộ. Mộ + Tuần Không thường KHÔNG tính là Mộ (case MO_BI_TUAN_KHONG_HUY) — trừ khi có hào Động khác sinh cho hào này thì thành ngoại lệ THÀNH lúc thực Không.`
            });
        } else if (quanHe === "xung") {
            ketQua.push({
                case: "TK_HAODONG_XUNG",
                ghiChu: `Hào Động ${haoDongSo} (${haoDongChi}) xung Hào Tuần Không (${chiKhong}) — tính là Ám Xung (xung ngầm), có thể có tác động dù hào kia đang Không.`
            });
        }

        const bienMatch = matchesGlobal.find(m => m.nguon === "Quẻ Biến" && m.hao === Number(haoDongSo));
        if (bienMatch) {
            ketQua.push({
                case: "TK_HAODONG_HOA_BIEN_GAP_KHONG",
                ketLuan: "CHO_THOI_DIEM_" + bienMatch.chi,
                ghiChu: `Hào ${haoDongSo} Động hóa ra Hào Biến (${bienMatch.lucThan} ${bienMatch.chi} ${bienMatch.hanh}) cũng đang Tuần Không. Trước mốc thời gian mang Chi ${bienMatch.chi}, hào Biến này chỉ có khoảng 50% lực; đến đúng thời điểm mang Chi ${bienMatch.chi} (gần = tháng ${bienMatch.chi}, xa = năm ${bienMatch.chi}) mới Thực Không thật sự và phát huy đủ tác dụng.`
            });
        }

        return ketQua;
    }

    /* ------------------------------------------------------------------
     * LỚP QUÉT (GATEWAY) + UI
     * ------------------------------------------------------------------ */
    let matchesGlobal = [];

    const chiOptionsHtml = '<option value="">-- Chọn --</option>' +
        DIA_CHI.map(c => `<option value="${c}">${c}</option>`).join("");
    const haoOptionsHtml = Array.from({ length: 6 }, (_, k) => k + 1)
        .map(h => `<option value="${h}">Hào ${h}</option>`).join("");

    const boxHtml = `
        <div class="header" style="border-bottom: 1px solid var(--gold); padding: 5px 0 10px 0; margin-bottom: 15px;">
            <h1 style="font-size: 1.1rem;">Module 1 — Tuần Không</h1>
        </div>

        <label>Phục Thần ẩn tàng dưới Hào (bỏ trống nếu Hào không có Phục Thần)</label>
        <div class="ts-hao-grid" style="grid-template-columns: 1fr 1fr;">
            <input type="text" id="m01_pt1" placeholder="Hào 1, vd: Tử Tôn Mão Mộc">
            <input type="text" id="m01_pt2" placeholder="Hào 2">
            <input type="text" id="m01_pt3" placeholder="Hào 3">
            <input type="text" id="m01_pt4" placeholder="Hào 4">
            <input type="text" id="m01_pt5" placeholder="Hào 5">
            <input type="text" id="m01_pt6" placeholder="Hào 6">
        </div>

        <label>Chọn tối đa 2 Địa Chi Tuần Không</label>
        <div class="m-grid">
            <select id="m01_tkChi1">${chiOptionsHtml}</select>
            <select id="m01_tkChi2">${chiOptionsHtml}</select>
        </div>
        <button class="btn-secondary" id="m01_autoBtn">↺ Tự Tính Tuần Không Từ Nhật (ô Nhật Thần ở Tứ Trị)</button>

        <button class="m-btn-process" id="m01_quetBtn">🔍 QUÉT HÀO MANG ĐỊA CHI TUẦN KHÔNG</button>

        <div id="m01_matches"></div>

        <button class="m-btn-process" id="m01_tinhBtn" style="display:none;">⚡ TÍNH KẾT LUẬN TUẦN KHÔNG</button>
        <textarea id="m01_output" class="m-output-box" readonly></textarea>
        <button class="btn-copy" id="m01_copyBtn" style="display:none;">📋 SAO CHÉP KẾT QUẢ TUẦN KHÔNG</button>
        <div class="fallback-box" id="m01_fallbackBox">
            <textarea id="m01_fallbackText" readonly></textarea>
            <div class="fallback-hint">Trình duyệt chặn copy tự động — bấm vào ô trên để chọn hết rồi copy thủ công (Ctrl+C / giữ để copy)</div>
        </div>
    `;

    const box = moduleSlot(boxHtml);
    const $ = (id) => box.querySelector("#" + id);
    $("m01_output").addEventListener("click", function () { this.select(); });
    $("m01_fallbackText").addEventListener("click", function () { this.select(); });

    function tuKhongTuTinhTuNhat() {
        const nhatEl = document.getElementById("mNhat"); // ô Nhật Thần nằm ở box Tứ Trị (core)
        if (!nhatEl) {
            alert("Không tìm thấy ô Nhật Thần (Tứ Trị) trên trang — kiểm tra lại total.html.");
            return;
        }
        const parts = nhatEl.value.trim().split(/\s+/);
        if (parts.length < 2) {
            alert("Vui lòng nhập đầy đủ Can Chi ở ô Nhật Thần (phần Tứ Trị) trước, vd: Đinh Sửu.");
            return;
        }
        try {
            const pair = tinhTuanKhong(parts[0], parts[1]);
            $("m01_tkChi1").value = pair[0];
            $("m01_tkChi2").value = pair[1];
        } catch (e) {
            alert("Can/Chi không hợp lệ: " + e.message);
        }
    }

    function quetHao() {
        const cungKeyChu = document.getElementById("selectCung").value;
        const qNameChu = document.getElementById("selectQue").value;
        if (!cungKeyChu || !qNameChu) {
            alert("Vui lòng chọn Họ Quẻ và Tên Quẻ Chủ ở phần trên trước.");
            return;
        }
        const chuData = dataDich[cungKeyChu].quẻ[qNameChu];
        const cungChu = dataDich[cungKeyChu];
        const queBienData = (typeof bienQueGiam !== "undefined" && bienQueGiam) ? bienQueGiam.data : null;

        const tuanKhongChiArr = [$("m01_tkChi1").value, $("m01_tkChi2").value].filter(Boolean);
        if (tuanKhongChiArr.length === 0) {
            alert("Vui lòng chọn ít nhất 1 Địa Chi Tuần Không (hoặc bấm Tự Tính Từ Nhật).");
            return;
        }

        const matches = [];
        const thuongDong = selectedDong.some(h => h >= 4);
        const haDong = selectedDong.some(h => h <= 3);

        for (let h = 1; h <= 6; h++) {
            const i = h - 1;

            const chiHanhChu = getChiHanh(chuData.n[i]);
            const chiChu = chiHanhChu.split(" ")[0];
            if (tuanKhongChiArr.includes(chiChu)) {
                matches.push({
                    nguon: "Quẻ Chính", hao: h,
                    lucThan: layLucThan(chuData.n[i]),
                    chi: chiChu, hanh: getHanh(chiHanhChu),
                    laTinh: !selectedDong.includes(h)
                });
            }

            if (queBienData) {
                const isHaoThuong = (h >= 4);
                const quaiNayCoDong = (isHaoThuong && thuongDong) || (!isHaoThuong && haDong);
                if (quaiNayCoDong) {
                    const chiHanhBien = getChiHanh(queBienData.n[i]);
                    const chiBien = chiHanhBien.split(" ")[0];
                    if (tuanKhongChiArr.includes(chiBien)) {
                        matches.push({
                            nguon: "Quẻ Biến", hao: h,
                            lucThan: tinhLucThan(getHanh(chiHanhBien), cungChu.hanh),
                            chi: chiBien, hanh: getHanh(chiHanhBien),
                            laTinh: true
                        });
                    }
                }
            }

            const ptVal = $("m01_pt" + h).value.trim();
            if (ptVal) {
                const chiHanhPT = getChiHanh(ptVal);
                const chiPT = chiHanhPT.split(" ")[0];
                if (tuanKhongChiArr.includes(chiPT)) {
                    matches.push({
                        nguon: "Phục Thần (dưới Hào " + h + ")", hao: h,
                        lucThan: layLucThan(ptVal),
                        chi: chiPT, hanh: getHanh(chiHanhPT),
                        laTinh: true
                    });
                }
            }
        }

        renderMatches(matches);
    }

    function renderMatches(matches) {
        matchesGlobal = matches;
        const container = $("m01_matches");
        container.innerHTML = "";
        const btnTinh = $("m01_tinhBtn");
        const outputEl = $("m01_output");
        const copyBtn = $("m01_copyBtn");

        if (matches.length === 0) {
            container.innerHTML = '<p style="font-size:0.75rem;color:#888;margin:10px 0;">Không có hào nào (Quẻ Chính / Quẻ Biến / Phục Thần) mang Địa Chi Tuần Không đã chọn — yếu tố này không hiện hữu trong quẻ, bỏ qua không xét.</p>';
            btnTinh.style.display = "none";
            outputEl.style.display = "none";
            copyBtn.style.display = "none";
            return;
        }

        matches.forEach((m, idx) => {
            const mBox = document.createElement("div");
            mBox.style.cssText = "border:1px solid var(--gold); border-radius:8px; padding:10px; margin-bottom:10px;";
            let html = `<div style="font-size:0.85rem;color:var(--gold);font-weight:600;margin-bottom:8px;">
                #${idx + 1} — ${m.nguon}, Hào ${m.hao}: ${m.lucThan} ${m.chi} ${m.hanh} (${m.laTinh ? "Tĩnh" : "Động"})
            </div>`;

            if (m.laTinh) {
                html += `
                    <select id="m01_${idx}_loaiViec" style="margin-bottom:8px;">
                        <option value="taiVat">Tài vật</option>
                        <option value="nhanSu">Nhân sự</option>
                    </select>
                    <select id="m01_${idx}_vuongSuy" style="margin-bottom:8px;">
                        <option value="Vuong">Vượng</option><option value="Tuong">Tướng</option>
                        <option value="Huu">Hưu</option><option value="Suy">Suy</option><option value="Tu">Tử</option>
                    </select>
                    <label style="font-size:0.7rem;display:block;margin-bottom:6px;"><input type="checkbox" id="m01_${idx}_suKienCoDinh"> Sự việc có mốc cố định</label>
                    <label style="font-size:0.7rem;display:block;margin-bottom:6px;"><input type="checkbox" id="m01_${idx}_daQuaMoc"> Đã qua mốc xung/thực Không</label>
                    <label style="font-size:0.7rem;display:block;margin-bottom:6px;"><input type="checkbox" id="m01_${idx}_coMo"> Hào này đồng thời là Mộ</label>
                    <label style="font-size:0.7rem;display:block;margin-bottom:6px;"><input type="checkbox" id="m01_${idx}_coHaoDongSinh"> Có hào Động khác sinh cho hào này</label>
                    <label style="font-size:0.7rem;display:block;"><input type="checkbox" id="m01_${idx}_laKinhDoanh"> Dụng thần Tài, bối cảnh kinh doanh</label>
                `;
            } else {
                html += `
                    <label style="font-size:0.7rem;display:block;margin-bottom:6px;"><input type="checkbox" id="m01_${idx}_suKienCoDinh"> Sự việc có mốc cố định</label>
                    <div class="m-grid">
                        <div><label style="font-size:0.65rem;">Số điểm cần khớp (2 hoặc 3)</label>
                        <input type="number" id="m01_${idx}_soDiemCanKhop" value="2"></div>
                        <div><label style="font-size:0.65rem;">Số điểm đã khớp</label>
                        <input type="number" id="m01_${idx}_soDiemDaKhop" value="0"></div>
                    </div>
                    <label style="font-size:0.7rem;display:block;margin-top:6px;"><input type="checkbox" id="m01_${idx}_gapMoBien"> Gặp Mộ Biến (Nhật xung hoặc hào Động hóa Mộ)</label>
                `;
            }

            html += `
                <hr style="border-color:#333;margin:12px 0;">
                <label style="font-size:0.7rem;display:block;margin-bottom:4px;">Hào Động tương tác với Hào Tuần Không này (để trống = không có)</label>
                <div class="m-grid">
                    <select id="m01_${idx}_haoDongSo">
                        <option value="">-- Không có --</option>
                        ${haoOptionsHtml}
                    </select>
                    <select id="m01_${idx}_haoDongQuanHe">
                        <option value="">-- Quan hệ --</option>
                        <option value="sinh">Sinh cho hào Không</option>
                        <option value="khac">Khắc hào Không</option>
                        <option value="nhapMo">Làm hào Không nhập Mộ</option>
                        <option value="xung">Xung hào Không</option>
                    </select>
                </div>
                <label style="font-size:0.7rem;display:block;margin:6px 0 4px;"><input type="checkbox" id="m01_${idx}_nhatLamMo"> Nhật làm Hào Tuần Không này nhập Mộ</label>
                <label style="font-size:0.7rem;display:block;"><input type="checkbox" id="m01_${idx}_nguyetLamMo"> Nguyệt làm Hào Tuần Không này nhập Mộ</label>
            `;

            mBox.innerHTML = html;
            container.appendChild(mBox);
        });

        btnTinh.style.display = "block";
        outputEl.style.display = "none";
        copyBtn.style.display = "none";
    }

    function tinhKetLuan() {
        let text = "=== MODULE 1 — KẾT QUẢ XỬ LÝ TUẦN KHÔNG ===\n";
        const tuanKhongChiArr = [$("m01_tkChi1").value, $("m01_tkChi2").value].filter(Boolean);
        text += `Địa Chi Tuần Không đang xét: ${tuanKhongChiArr.join(", ")}\n\n`;

        const mNhatEl = document.getElementById("mNhat");
        const mNguyetEl = document.getElementById("mNguyet");
        const chiNhatFull = mNhatEl ? mNhatEl.value.trim().split(/\s+/) : [];
        const chiNguyetFull = mNguyetEl ? mNguyetEl.value.trim().split(/\s+/) : [];
        const chiNhat = chiNhatFull[1] || "";
        const chiNguyet = chiNguyetFull[1] || "";

        matchesGlobal.forEach((m, idx) => {
            text += `--- #${idx + 1}: ${m.nguon}, Hào ${m.hao} — ${m.lucThan} ${m.chi} ${m.hanh} (${m.laTinh ? "Tĩnh" : "Động"}) ---\n`;
            const phamVi = LUC_THAN_PHAM_VI[m.lucThan];
            if (phamVi) text += `Phạm vi ảnh hưởng (${m.lucThan}): ${phamVi}\n`;

            if (m.laTinh) {
                const p = {
                    loaiViec: $(`m01_${idx}_loaiViec`).value,
                    vuongSuy: $(`m01_${idx}_vuongSuy`).value,
                    suKienCoDinh: $(`m01_${idx}_suKienCoDinh`).checked,
                    daQuaMocXungThuc: $(`m01_${idx}_daQuaMoc`).checked,
                    coMo: $(`m01_${idx}_coMo`).checked,
                    coHaoDongSinh: $(`m01_${idx}_coHaoDongSinh`).checked,
                    laKinhDoanh: $(`m01_${idx}_laKinhDoanh`).checked
                };
                xetTinhTuanKhong(p).forEach(c => {
                    text += `• [${c.case}]${c.ketLuan ? " → " + c.ketLuan : ""}\n  ${c.ghiChu || ""}\n`;
                    if (c.luuY) text += `  Lưu ý: ${c.luuY}\n`;
                    if (c.tuong) text += `  Tượng: ${c.tuong}\n`;
                    if (c.ungKy) text += `  Ứng kỳ: ${c.ungKy}\n`;
                });
            } else {
                const p = {
                    suKienCoDinh: $(`m01_${idx}_suKienCoDinh`).checked,
                    soDiemCanKhop: parseInt($(`m01_${idx}_soDiemCanKhop`).value) || 2,
                    soDiemDaKhop: parseInt($(`m01_${idx}_soDiemDaKhop`).value) || 0,
                    gapMoBien: $(`m01_${idx}_gapMoBien`).checked
                };
                xetDongTuanKhong(p).forEach(c => {
                    text += `• [${c.case}]${c.ketLuan ? " → " + c.ketLuan : ""}\n  ${c.ghiChu || ""}\n`;
                });
            }

            const nhatLamMo = $(`m01_${idx}_nhatLamMo`).checked;
            const nguyetLamMo = $(`m01_${idx}_nguyetLamMo`).checked;
            xetQuanHeTruVoiHaoKhong(m.chi, chiNhat, "Nhật", nhatLamMo).forEach(c => {
                text += `• [${c.case}]${c.ketLuan ? " → " + c.ketLuan : ""}\n  ${c.ghiChu || ""}\n`;
            });
            xetQuanHeTruVoiHaoKhong(m.chi, chiNguyet, "Nguyệt", nguyetLamMo).forEach(c => {
                text += `• [${c.case}]${c.ketLuan ? " → " + c.ketLuan : ""}\n  ${c.ghiChu || ""}\n`;
            });

            const haoDongSo = $(`m01_${idx}_haoDongSo`).value;
            const haoDongQuanHe = $(`m01_${idx}_haoDongQuanHe`).value;
            if (haoDongSo && haoDongQuanHe) {
                const cungKeyChu = document.getElementById("selectCung").value;
                const qNameChu = document.getElementById("selectQue").value;
                const chuData = dataDich[cungKeyChu].quẻ[qNameChu];
                const haoDongChi = getChiHanh(chuData.n[haoDongSo - 1]).split(" ")[0];
                xetHaoDongTuongTac(m.chi, haoDongSo, haoDongChi, haoDongQuanHe, chiNhat, chiNguyet).forEach(c => {
                    text += `• [${c.case}]${c.ketLuan ? " → " + c.ketLuan : ""}\n  ${c.ghiChu || ""}\n`;
                });
            }

            text += "\n";
        });

        text += "=== HẾT MODULE 1 — TUẦN KHÔNG ===";

        const outputEl = $("m01_output");
        outputEl.value = text;
        outputEl.style.display = "block";
        $("m01_copyBtn").style.display = "block";
        $("m01_fallbackBox").style.display = "none";
    }

    function copyKetQua() {
        const text = $("m01_output").value;
        if (!text) return;

        function showSuccess() {
            const btn = $("m01_copyBtn");
            $("m01_fallbackBox").style.display = "none";
            btn.innerText = "✅ ĐÃ SAO CHÉP!";
            setTimeout(() => { btn.innerText = "📋 SAO CHÉP KẾT QUẢ TUẦN KHÔNG"; }, 2000);
        }
        function showFallback() {
            const fbBox = $("m01_fallbackBox");
            const ta = $("m01_fallbackText");
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
            } catch (e) {
                return false;
            }
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(showSuccess).catch(() => {
                if (tryExecCommandCopy()) showSuccess();
                else showFallback();
            });
        } else if (tryExecCommandCopy()) {
            showSuccess();
        } else {
            showFallback();
        }
    }

    $("m01_autoBtn").addEventListener("click", tuKhongTuTinhTuNhat);
    $("m01_quetBtn").addEventListener("click", quetHao);
    $("m01_tinhBtn").addEventListener("click", tinhKetLuan);
    $("m01_copyBtn").addEventListener("click", copyKetQua);

})();
