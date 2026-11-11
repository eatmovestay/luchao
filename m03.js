// =========================================================================
// MODULE 03: XỬ LÝ TOÀN DIỆN LOGIC MỘ KHỐ CỔ PHÁP (m03.js)
// Dựa trên lý thuyết & quẻ thực chiến của Tác giả Khúc Vĩ
//
// CẦU NỐI DỮ LIỆU (bản vá): module tự động lấy dữ liệu có sẵn, không cần chạy m02 trước:
//   • Code nền : Tứ Trị (Nhật/Nguyệt lấy từ ô Tứ Trị), Họ Quẻ + Quẻ Chủ, Hào Động, Quẻ Biến
//   • m01.js   : Tuần Không đã khai báo + Phục Thần dưới từng Hào
//   • m02.js   : window.M02_DATA chỉ còn là phương án dự phòng khi Form Nền thiếu Nhật Thần
// Thuật toán Mộ Khố (3 hình thức Nhập Mộ, 3 phương thức Xuất Mộ, ngữ cảnh) giữ nguyên.
// =========================================================================

/* =========================================================================
 * LH_BRIDGE v1 — CẦU NỐI DỮ LIỆU (khối dùng chung, GIỐNG HỆT nhau trong m02.js & m03.js)
 * Chỉ ĐỌC dữ liệu đã có sẵn, không sửa gì ở code nền / m01 / mchienluoc:
 *   - Code nền  : Tứ Trị (mThoi/mNhat/mNguyet/mThaiTue/mTuanKhong), quẻ Chủ
 *             	(selectCung/selectQue), selectedDong, quẻ Biến (tính lại bằng findQueByCode)
 *   - m01.js	: Tuần Không (m01_tkChi1/2) + Phục Thần dưới từng Hào (m01_pt1..6)
 *   - m02.js	: window.M02_DATA (chỉ dùng làm phương án cuối khi code nền thiếu Nhật)
 *   - mchienluoc.js (m06) là công cụ tra cứu ĐỘC LẬP, không chia sẻ dữ liệu với quẻ đang
 *             	luận nên cầu nối không đọc từ đó.
 * Ai nạp trước thì định nghĩa; file nạp sau thấy đã có thì bỏ qua (không ghi đè).
 * ========================================================================= */
(function () {
	if (window.LH_BRIDGE && window.LH_BRIDGE.version >= 1) return;

	const CAN_ALL = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
	const CHI_ALL = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
	const KV_PAIRS = [["Tuất", "Hợi"], ["Thân", "Dậu"], ["Ngọ", "Mùi"], ["Thìn", "Tỵ"], ["Dần", "Mão"], ["Tý", "Sửu"]];
	const TUAN_NAME = ["Giáp Tý", "Giáp Tuất", "Giáp Thân", "Giáp Ngọ", "Giáp Thìn", "Giáp Dần"];
	const CHI_ALIAS = { "Tị": "Tỵ", "Mẹo": "Mão" };

	const nfc = (s) => String(s == null ? "" : s).normalize("NFC").trim();
	const getVal = (id) => { const e = document.getElementById(id); return e ? nfc(e.value) : ""; };
	const getRaw = (id) => { const e = document.getElementById(id); return e && e.value ? e.value : ""; };
	const normChi = (s) => { s = nfc(s); s = CHI_ALIAS[s] || s; return CHI_ALL.indexOf(s) >= 0 ? s : ""; };
	const normCan = (s) => { s = nfc(s); return CAN_ALL.indexOf(s) >= 0 ? s : ""; };

	// Tìm Địa Chi đầu tiên trong chuỗi bất kỳ: "Tử Tôn Mão Mộc" -> "Mão", "Quan Quỷ Dậu" -> "Dậu"
	function findChi(text) {
    	const tokens = nfc(text).split(/[\s,;()\/+\-]+/);
    	for (let k = 0; k < tokens.length; k++) {
        	const c = normChi(tokens[k]);
        	if (c) return c;
    	}
    	return "";
	}

	// "Giáp Tý" -> {can:"Giáp", chi:"Tý"}; chỉ gõ "Tý" -> {can:"", chi:"Tý"}
	function parseCanChi(str) {
    	const t = nfc(str).split(/\s+/).filter(Boolean);
    	if (t.length >= 2) return { can: normCan(t[0]), chi: normChi(t[1]) };
    	if (t.length === 1) return { can: "", chi: normChi(t[0]) };
    	return { can: "", chi: "" };
	}

	// Tuần Không (Không Vong) từ Can Chi của Nhật; null nếu Can Chi không hợp lệ (sai Âm/Dương)
	function tkTuNhat(can, chi) {
    	const ci = CAN_ALL.indexOf(can), hi = CHI_ALL.indexOf(chi);
    	if (ci < 0 || hi < 0) return null;
    	for (let n = 0; n < 60; n++) {
        	if (n % 10 === ci && n % 12 === hi) {
            	const g = Math.floor(n / 10);
            	return { pair: KV_PAIRS[g].slice(), name: TUAN_NAME[g] };
        	}
    	}
    	return null;
	}

	function lucThanCuaNap(nap) {
    	return nap.replace(/\(Thế\)|\(Ứng\)/g, "").trim().split(/\s+/).slice(0, -2).join(" ");
	}

	// opts.nhat (tuỳ chọn): Nhật nhập tay thay cho ô Nhật của code nền
	function collect(opts) {
    	opts = opts || {};
    	const out = {
        	tuTri: {},
        	tuanKhong: { chi: [], nguon: "", tuNhat: null, canhBao: "" },
        	phucThan: [],
        	dong: [],
        	que: null
    	};

    	// ---------- 1. TỨ TRỊ (code nền) ----------
    	const T = out.tuTri;
    	T.thoi = getVal("mThoi");
    	T.nhat = opts.nhat ? nfc(opts.nhat) : getVal("mNhat");
    	T.nguyet = getVal("mNguyet");
    	T.thaiTue = getVal("mThaiTue");
    	T.nhatNguon = opts.nhat ? "nhập tay" : "Code nền (Tứ Trị)";

    	const pNhat = parseCanChi(T.nhat), pNguyet = parseCanChi(T.nguyet);
    	const pTue = parseCanChi(T.thaiTue), pThoi = parseCanChi(T.thoi);
    	T.nhatCan = pNhat.can; T.nhatChi = pNhat.chi;
    	T.nguyetCan = pNguyet.can; T.nguyetChi = pNguyet.chi;
    	T.thaiTueCan = pTue.can; T.thaiTueChi = pTue.chi;
    	T.thoiCan = pThoi.can; T.thoiChi = pThoi.chi;

    	// Phương án dự phòng khi ô Tứ Trị còn trống: ô Trường Sinh (chỉ có Chi) rồi tới M02_DATA
    	if (!T.nhatChi && !opts.nhat) {
        	const s = normChi(getVal("tsNhat"));
        	if (s) { T.nhatChi = s; if (!T.nhat) T.nhat = s; T.nhatNguon = "Code nền (ô Trường Sinh)"; }
    	}
    	if (!T.nguyetChi) {
        	const s = normChi(getVal("tsNguyet"));
        	if (s) { T.nguyetChi = s; if (!T.nguyet) T.nguyet = s; }
    	}
    	if (!T.nhatChi && !opts.nhat && window.M02_DATA && window.M02_DATA.nhatChi) {
        	const s = normChi(window.M02_DATA.nhatChi);
        	if (s) {
            	T.nhatChi = s;
            	T.nhatCan = normCan(window.M02_DATA.nhatCan);
            	T.nhat = (T.nhatCan ? T.nhatCan + " " : "") + s;
            	T.nhatNguon = "M02 (lần chạy trước)";
        	}
    	}

    	// ---------- 2. TUẦN KHÔNG: m01 -> ô Tuần Không của code nền -> tính từ Nhật ----------
    	const tuNhat = tkTuNhat(T.nhatCan, T.nhatChi);
    	out.tuanKhong.tuNhat = tuNhat;
    	let declared = [], nguon = "";
    	if (!opts.nhat) {   // đã nhập tay Nhật khác thì bỏ khai báo cũ để khỏi lệch ngày
        	const fromM01 = [getVal("m01_tkChi1"), getVal("m01_tkChi2")].map(normChi).filter(Boolean);
        	if (fromM01.length) {
            	declared = fromM01; nguon = "Module 1 (m01)";
        	} else {
            	const fromBase = getVal("mTuanKhong").split(/[\s,;\/+\-]+/).map(normChi).filter(Boolean);
            	if (fromBase.length) { declared = fromBase.slice(0, 2); nguon = "Code nền (ô Tuần Không)"; }
        	}
    	}
    	declared = declared.filter((c, i) => declared.indexOf(c) === i);
    	if (declared.length) {
        	out.tuanKhong.chi = declared;
        	out.tuanKhong.nguon = nguon;
        	if (tuNhat && !declared.every((c) => tuNhat.pair.indexOf(c) >= 0)) {
            	out.tuanKhong.canhBao = "Tuần Không khai báo (" + declared.join(", ") + ") khác Tuần Không tính từ Nhật "
                	+ T.nhat + " (" + tuNhat.pair.join(", ") + ") — đang dùng theo khai báo.";
        	}
    	} else if (tuNhat) {
        	out.tuanKhong.chi = tuNhat.pair.slice();
        	out.tuanKhong.nguon = opts.nhat ? "tính từ Nhật nhập tay" : "tính từ Nhật Thần (Code nền)";
    	}
    	const tkChi = out.tuanKhong.chi;

    	// ---------- 3. PHỤC THẦN dưới từng Hào (m01_pt1..m01_pt6) ----------
    	for (let h = 1; h <= 6; h++) {
        	const info = getVal("m01_pt" + h);
        	if (info) out.phucThan.push({ hao: h, info: info, chi: findChi(info), nguon: "m01" });
    	}

    	// ---------- 4. QUẺ CHỦ + HÀO ĐỘNG + QUẺ BIẾN (code nền) ----------
    	const cungKey = getRaw("selectCung"), queName = getRaw("selectQue");
    	if (cungKey && queName && typeof dataDich !== "undefined" && dataDich[cungKey] && dataDich[cungKey].quẻ[queName]) {
        	const cung = dataDich[cungKey];
        	const data = cung.quẻ[queName];
        	const dong = (typeof selectedDong !== "undefined" ? selectedDong : []).slice().sort((a, b) => a - b);
        	out.dong = dong;

        	const q = { cungKey: cungKey, ten: queName, cungName: cung.name, cungHanh: cung.hanh,
                    	cung: cung, data: data, haoList: [], bien: null };
        	for (let h = 1; h <= 6; h++) {
            	const i = h - 1;
            	const nap = data.n[i];
            	const chiHanh = getChiHanh(nap);
            	const chi = chiHanh.split(" ")[0];
            	q.haoList.push({
                	hao: h, nap: nap, lucThan: lucThanCuaNap(nap), chi: chi, hanh: getHanh(chiHanh),
                	theUng: nap.indexOf("(Thế)") >= 0 ? "Thế" : (nap.indexOf("(Ứng)") >= 0 ? "Ứng" : ""),
                	isYang: data.c[5 - i] === "1",
                	isDong: dong.indexOf(h) >= 0,
                	isTK: tkChi.indexOf(chi) >= 0
            	});
        	}

        	// Quẻ Biến: tính lại từ quẻ Chủ + hào động (không phụ thuộc biến bienQueGiam có bị cũ hay không)
        	if (dong.length) {
            	let bienFound = null;
            	if (typeof findQueByCode === "function") {
                	const arr = data.c.split("");
                	dong.forEach((h) => { const b = 6 - h; arr[b] = arr[b] === "1" ? "0" : "1"; });
                	bienFound = findQueByCode(arr.join(""));
            	}
            	if (!bienFound && typeof bienQueGiam !== "undefined" && bienQueGiam) bienFound = bienQueGiam;
            	if (bienFound && bienFound.data) {
                	const thuongDong = dong.some((h) => h >= 4), haDong = dong.some((h) => h <= 3);
                	const bien = { ten: bienFound.name, cungName: bienFound.cung.name, cungHanh: bienFound.cung.hanh,
                               	data: bienFound.data, haoList: [] };
                	for (let h = 1; h <= 6; h++) {
                    	const i = h - 1;
                    	const nap = bienFound.data.n[i];
                    	const chiHanh = getChiHanh(nap);
                    	const chi = chiHanh.split(" ")[0];
                    	const hanh = getHanh(chiHanh);
                    	bien.haoList.push({
                        	hao: h, nap: nap, chi: chi, hanh: hanh,
                        	lucThan: tinhLucThan(hanh, cung.hanh),   // Lục Thân tính theo hành cung Chủ (đúng quy ước code nền)
                        	quaiCoDong: (h >= 4 && thuongDong) || (h <= 3 && haDong),
                        	isTK: tkChi.indexOf(chi) >= 0
                    	});
                	}
                	q.bien = bien;
            	}
        	}
        	out.que = q;
    	}
    	return out;
	}

	window.LH_BRIDGE = {
    	version: 1, collect: collect, findChi: findChi, normChi: normChi, parseCanChi: parseCanChi,
    	tkTuNhat: tkTuNhat, CAN_ALL: CAN_ALL, CHI_ALL: CHI_ALL, KV_PAIRS: KV_PAIRS, TUAN_NAME: TUAN_NAME
	};
})();

(function () {

	// 1. Bản đồ Mộ Khố chuẩn Ngũ Hành
	// Mộc (Dần, Mão) -> Mộ tại Mùi | Hỏa (Tỵ, Ngọ) -> Mộ tại Tuất
	// Thủy (Tý, Hợi) -> Mộ tại Thìn | Kim (Thân, Dậu) -> Mộ tại Sửu
	const MO_MAP = {
    	"Dần": "Mùi", "Mão": "Mùi",
    	"Tỵ": "Tuất", "Ngọ": "Tuất",
    	"Tý": "Thìn", "Hợi": "Thìn",
    	"Thân": "Sửu", "Dậu": "Sửu"
	};

	// Chi Xung Mộ (Phá Mộ Khóa)
	const XUNG_MO_MAP = {
    	"Thìn": "Tuất", "Tuất": "Thìn",
    	"Sửu": "Mùi", "Mùi": "Sửu"
	};

	// Chi Hợp Mộ (Kéo Mộ / Nhả Hào)
	const HOP_MO_MAP = {
    	"Thìn": "Dậu", "Tuất": "Mão",
    	"Sửu": "Tý", "Mùi": "Ngọ"
	};

	// Chi Xung Hào (Bật Hào ra khỏi Mộ)
	const XUNG_HAO_MAP = {
    	"Tý": "Ngọ", "Ngọ": "Tý", "Sửu": "Mùi", "Mùi": "Sửu",
    	"Dần": "Thân", "Thân": "Dần", "Mão": "Dậu", "Dậu": "Mão",
    	"Thìn": "Tuất", "Tuất": "Thìn", "Tỵ": "Hợi", "Hợi": "Tỵ"
	};

	// 2. Tạo giao diện UI và chèn vào khung #module-slots của total.html
	const myModuleBox = moduleSlot(`
    	<div class="header" style="border-bottom: 1px solid var(--gold); padding: 5px 0 10px 0; margin-bottom: 15px;">
        	<h1 style="font-size: 1.1rem; color: var(--gold); margin: 0; text-transform: uppercase; text-align: center;">MODULE 03: Xử Lý Logic Mộ Khố Cổ Pháp (Khúc Vĩ)</h1>
    	</div>

    	<div style="font-size: 0.8rem; color: #ccc; margin-bottom: 12px; line-height: 1.4;">
        	Mô-đun tự động quét <b>3 Hình Thức Nhập Mộ</b> (Nhật/Nguyệt Mộ, Hào Tĩnh Mộ Hào Động, Động Hóa Mộ Cùng Tuyến) và <b>3 Phương Thức Xuất Mộ</b> (Xung Mộ, Xung Hào, Hợp Mộ) dựa trên dữ liệu Tứ Trị &amp; Quẻ. Dữ liệu được tự lấy từ Form Nền và Module 1 — không cần nhập lại.
    	</div>

    	<div class="m-grid">
        	<div class="input-suggest-box">
            	<label>Chọn Hào Cần Soi Mộ Trọng Điểm (Dụng Thần / Thế)</label>
            	<select id="m03_HaoSoi">
                	<option value="0">-- Quét Toàn Bộ 6 Hào --</option>
                	<option value="1">Soi Trọng Điểm Hào 1</option>
                	<option value="2">Soi Trọng Điểm Hào 2</option>
                	<option value="3">Soi Trọng Điểm Hào 3</option>
                	<option value="4">Soi Trọng Điểm Hào 4</option>
                	<option value="5">Soi Trọng Điểm Hào 5</option>
                	<option value="6">Soi Trọng Điểm Hào 6</option>
            	</select>
        	</div>
        	<div class="input-suggest-box">
            	<label>Phân Loại Ngữ Cảnh Chiêm Đoán</label>
            	<select id="m03_NguCanh">
                	<option value="tong_quat">Chiêm Tổng Quát / Cầu Sự</option>
                	<option value="benh_tat">Chiêm Bệnh Tật / An Nguy (Ngắn hạn / Lâu dài)</option>
                	<option value="nguoi_xa">Chiêm Người Đi Xa Khi Nào Về / Định Cư</option>
                	<option value="phap_ly">Chiêm Pháp Lý / Rủi Ro / Chức Vụ Cơ Quan</option>
            	</select>
        	</div>
    	</div>

    	<button class="m-btn-process" onclick="processModule03()">🔮 TÍNH TOÁN LOGIC MỘ KHỐ (M03)</button>
    	<textarea id="m03_Output" class="m-output-box" readonly onclick="this.select()"></textarea>
    	<button id="m03_BtnCopy" class="btn-copy" style="display:none; margin-top:10px;" onclick="copyModule03Text()">📋 SAO CHÉP KẾT QUẢ MODULE 03 (DATA MỘ CẤP TRỌNG YẾU)</button>
	`);

	// Helper lấy Chi từ chuỗi Nạp Giáp
	function extractChi(napStr) {
    	if (!napStr) return "";
    	let clean = napStr.replace(/\(Thế\)|\(Ứng\)/g, "").trim();
    	let words = clean.split(/\s+/);
    	if (words.length >= 2) return words[words.length - 2];
    	return words[0] || "";
	}

	// 3. Hàm xử lý logic chính của MODULE 03
	window.processModule03 = function () {
    	const haoSoi = parseInt(document.getElementById("m03_HaoSoi").value);
    	const nguCanh = document.getElementById("m03_NguCanh").value;

    	// ===== CẦU NỐI: gom toàn bộ dữ liệu từ Code Nền + m01 (+ m02 nếu thiếu Nhật) =====
    	const B = window.LH_BRIDGE.collect();

    	if (!B.que) {
        	alert("Vui lòng chọn Họ Quẻ và Tên Quẻ Chủ ở phần trên trước!");
        	return;
    	}

    	// Thuật toán Mộ so sánh theo ĐỊA CHI của Nhật / Nguyệt (đã tách từ Can Chi đầy đủ ở Tứ Trị)
    	const nhat = B.tuTri.nhatChi;
    	const nguyet = B.tuTri.nguyetChi;

    	const chuData = B.que.data;
    	const cacHaoDong = B.dong;
    	const bienData = B.que.bien ? B.que.bien.data : null;
    	const kvChi = B.tuanKhong.chi;

    	let res = `=== MODULE 03: KẾT QUẢ XỬ LÝ TOÀN DIỆN LOGIC MỘ KHỐ (CỔ PHÁP KHÚC VĨ) ===\n`;
    	res += `• Tứ Trị Chiêm Đoán : Nhật Thần: ${B.tuTri.nhat || "Chưa chọn"} | Nguyệt Lệnh: ${B.tuTri.nguyet || "Chưa chọn"}`
        	+ (B.tuTri.thaiTue ? ` | Thái Tuế: ${B.tuTri.thaiTue}` : ``) + `\n`;
    	res += `• Ngữ Cảnh Xử Lý   : ${document.getElementById("m03_NguCanh").options[document.getElementById("m03_NguCanh").selectedIndex].text}\n`;
    	res += `• Quẻ Chủ       	: ${B.que.ten} (Họ ${B.que.cungName} - ${B.que.cungHanh})` + (B.que.bien ? ` -> Quẻ Biến: ${B.que.bien.ten}` : ``) + `\n`;
    	res += `• Hào Động      	: ${cacHaoDong.length ? "Hào " + cacHaoDong.join(", Hào ") : "QUẺ TĨNH (không có hào động)"}\n`;
    	res += `• Tuần Không    	: ${kvChi.length ? kvChi.join(", ") + " (nguồn: " + B.tuanKhong.nguon + ")" : "Chưa xác định (thiếu Nhật Thần / chưa khai báo ở m01)"}\n`;
    	if (B.tuanKhong.canhBao) {
        	res += `• ⚠️ Cảnh báo   	: ${B.tuanKhong.canhBao}\n`;
    	}
    	res += `• Phục Thần     	: ${B.phucThan.length ? B.phucThan.map(p => `Hào ${p.hao}: ${p.info}`).join(" | ") : "Không có (hoặc chưa khai báo ở m01)"}\n\n`;

    	res += `--- I. PHÂN TÍCH QUY TẮC CẤP ĐỘ HÀO (THỨ BẬC CẤP NĂNG LƯỢNG) ---\n`;
    	res += `• Cấp 1 (Tối cao) : Nhật Thần & Nguyệt Kiến (Bất khả xâm phạm, không bao giờ bị Nhập Mộ).\n`;
    	res += `• Cấp 2        	: Hào Biến.\n`;
    	res += `• Cấp 3        	: Hào Động.\n`;
    	res += `• Cấp 4 (Thấp nhất): Hào Tĩnh.\n`;
    	res += `=> Nguyên tắc Cố định: Hào chỉ bị Nhập Mộ bởi Hào có CẤP ĐỘ CAO HƠN hoặc BẰNG CẤP ĐỘ (theo tuyến Động - Biến của chính nó).\n\n`;

    	res += `--- II. BẢNG QUÉT CHI TIẾT CÁC TRƯỜNG HỢP NHẬP MỘ TRONG QUẺ ---\n`;

    	let danhSachHaoMo = [];

    	for (let i = 5; i >= 0; i--) {
        	const haoThu = i + 1;
        	if (haoSoi !== 0 && haoSoi !== haoThu) continue;

        	const napStr = chuData.n[i];
        	const chi = extractChi(napStr);
        	const moTarget = MO_MAP[chi]; // Địa chi Mộ của Hào này
        	const isDong = cacHaoDong.includes(haoThu);

        	let moStatus = [];
        	let flagLockPower = false; // Đánh dấu Hào bị nhốt trong Mộ -> Tạm mất khả năng Sinh/Khắc/Hại

        	if (moTarget) {
            	// HÌNH THỨC A: Nhập Mộ tại Nhật Thần / Nguyệt Kiến (Cấp 1 Mộ Cấp 2,3,4)
            	if (nhat === moTarget) {
                	moStatus.push(`BỊ NHẬP MỘ TẠI NHẬT THẦN [ ${nhat} ] (Cấp 1 thu Cấp ${isDong ? 3 : 4})`);
                	flagLockPower = true;
            	}
            	if (nguyet === moTarget) {
                	moStatus.push(`BỊ NHẬP MỘ TẠI NGUYỆT KIẾN [ ${nguyet} ] (Cấp 1 thu Cấp ${isDong ? 3 : 4})`);
                	flagLockPower = true;
            	}

            	// HÌNH THỨC B: Hào Tĩnh Nhập Mộ ở Hào Động (Cấp 3 Mộ Cấp 4)
            	if (!isDong) {
                	// Tìm xem trong các hào động có hào nào mang chi Mộ của Hào Tĩnh này không
                	for (let hD of cacHaoDong) {
                    	const chiDong = extractChi(chuData.n[hD - 1]);
                    	if (chiDong === moTarget) {
                        	// Kiểm tra xem Hào Động Mộ này có bị khắc hỏng không
                        	let isMoBiKhac = false;
                        	if ((nhat === "Dần" || nguyet === "Dần") && chiDong === "Thìn") isMoBiKhac = true; // Ví dụ Quẻ 3 Khốn->Tùy

                        	if (isMoBiKhac) {
                            	moStatus.push(`Hào Động ${hD} [${chiDong}] là Mộ nhưng bị Tứ Trị Khắc Thương nát -> MẤT LỰC, KHÔNG THU ĐƯỢC HÀO TĨNH ${haoThu} VÀO MỘ`);
                        	} else {
                            	moStatus.push(`BỊ HÀO ĐỘNG ${hD} [ ${chiDong} ] THU VÀO MỘ (Cấp 3 thu Cấp 4)`);
                            	flagLockPower = true;
                        	}
                    	}
                	}
            	}

            	// HÌNH THỨC C: Hào Động Nhập Mộ tại Hào Biến CÙNG TUYẾN (Động Hóa Mộ)
            	if (isDong && bienData) {
                	const napGocBien = bienData.n[i];
                	const chiBien = extractChi(napGocBien);
                	if (chiBien === moTarget) {
                    	moStatus.push(`ĐỘNG HÓA MỘ CÙNG TUYẾN tại Hào Biến [ ${chiBien} ] (Cấp 2 thu Cấp 3) -> Tượng bị kẹt, trói buộc, câu lưu`);
                    	flagLockPower = true;
                	}
            	}
        	} else {
            	// Thổ Hào (Thìn, Tuất, Sửu, Mùi)
            	moStatus.push(`Hào Thổ (Mộ Khố tự thân)`);
        	}

        	// Kiểm tra Hào Biến bị Nhập Mộ tại Nhật/Nguyệt (Cấp 1 Mộ Cấp 2)
        	if (isDong && bienData) {
            	const napGocBien = bienData.n[i];
            	const chiBien = extractChi(napGocBien);
            	const moBienTarget = MO_MAP[chiBien];
            	if (moBienTarget) {
                	if (nhat === moBienTarget) {
                    	moStatus.push(`⚠️ HÀO BIẾN [ ${chiBien} ] BỊ NHẬP MỘ TẠI NHẬT [ ${nhat} ] -> Hào Biến bị khóa, tạm thời chưa thể Hồi Đầu Khắc/Sinh Hào Động!`);
                	}
                	if (nguyet === moBienTarget) {
                    	moStatus.push(`⚠️ HÀO BIẾN [ ${chiBien} ] BỊ NHẬP MỘ TẠI NGUYỆT [ ${nguyet} ] -> Hào Biến bị khóa, tạm thời chưa thể Hồi Đầu Khắc/Sinh Hào Động!`);
                	}
            	}
        	}

        	let strStatus = moStatus.length > 0 ? moStatus.join(" | ") : "Không bị Nhập Mộ (Tự Do)";

        	// Thông tin liên kết từ module trước (chỉ hiển thị dữ kiện, không thêm kết luận)
        	const tagDong = isDong ? " [Động]" : " [Tĩnh]";
        	const tagTK = kvChi.includes(chi) ? " [Tuần Không]" : "";
        	res += `• Hào ${haoThu}: ${napStr.padEnd(25, ' ')} [Chi: ${chi}]${tagDong}${tagTK} -> ${strStatus}\n`;

        	B.phucThan.filter(p => p.hao === haoThu).forEach(p => {
            	const ptTK = p.chi && kvChi.includes(p.chi) ? " [Tuần Không]" : "";
            	res += `   	└─ Phục Thần: ${p.info}${ptTK}\n`;
        	});

        	if (flagLockPower) {
            	danhSachHaoMo.push({ hao: haoThu, nap: napStr, chi: chi, moTarget: moTarget });
        	}
    	}

    	// III. PHƯƠNG THỨC XUẤT MỘ & ỨNG KỲ GIẢI TRỪ
    	res += `\n--- III. PHƯƠNG THỨC XUẤT MỘ (PHÁ MỘ) & ỨNG KỲ THỜI GIAN ---\n`;
    	if (danhSachHaoMo.length > 0) {
        	danhSachHaoMo.forEach(item => {
            	const chiHao = item.chi;
            	const chiMo = item.moTarget;
            	const chiXungMo = XUNG_MO_MAP[chiMo] || "";
            	const chiXungHao = XUNG_HAO_MAP[chiHao] || "";
            	const chiHopMo = HOP_MO_MAP[chiMo] || "";

            	res += `[ HÀO ${item.hao}: ${item.nap} BỊ KẸT TRONG MỘ ${chiMo} ]\n`;
            	res += `  + Cách 1 (Xung Mộ) : Gặp thời gian [ ${chiXungMo} ] Xung phá Mộ ${chiMo} -> Bật Mộ giải phóng Hào.\n`;
            	res += `  + Cách 2 (Xung Hào) : Gặp thời gian [ ${chiXungHao} ] Xung trực tiếp Hào ${chiHao} -> Kéo Hào ra khỏi Mộ.\n`;
            	res += `  + Cách 3 (Hợp Mộ) : Gặp thời gian [ ${chiHopMo} ] Lục Hợp với Mộ ${chiMo} (${chiMo} Hợp ${chiHopMo}) -> HẠO DỄ ỨNG NGHỆM NHẤT (Mộ bị kéo đi, nhả Hào ra).\n\n`;
        	});
    	} else {
        	res += `• Không có Hào trọng điểm nào đang bị kẹt trong Mộ.\n\n`;
    	}

    	// IV. PHÂN TÍCH THEO NGỮ CẢNH VÀ CẢNH BÁO
    	res += `--- IV. PHÂN TÍCH CHUYÊN SÂU THEO NGỮ CẢNH & CẢNH BÁO NGUY CƠ ---\n`;
    	if (nguCanh === "benh_tat") {
        	res += `⚠️ CHIÊM BỆNH TẬT / AN NGUY:\n`;
        	res += `  + Dụng Thần / Thế nhập Mộ = Tượng bệnh nặng mất ý thức, bị cách ly hoặc kẹt trong vùng nguy hiểm.\n`;
        	res += `  + Hào bị Nhập Mộ thì Hào Biến Khắc nó TAM THỜI CHƯA KHẮC ĐƯỢC (Được Mộ bảo vệ tạm thời).\n`;
        	res += `  + ỨNG KỲ NGUY HẠI: Khi đến ngày/tháng XUNG HÀO / XUNG MỘ ra khỏi Mộ, Hào sẽ lập tức chịu trọn lực Hồi Đầu Khắc thương (Cần đặc biệt lưu ý mốc Xung Hào trước hay Xung Mộ trước).\n`;
    	} else if (nguCanh === "nguoi_xa") {
        	res += `✈️ CHIÊM NGƯỜI ĐI XA KHI NÀO VỀ:\n`;
        	res += `  + Dụng Thần Động Hóa Mộ = Tượng người đi xa bị kẹt lại, trói buộc công việc, bị câu lưu chưa thể về.\n`;
        	res += `  + GIẢI TRỪ VỀ NHÀ: Ứng nghiệm rõ nhất vào thời gian [ HỢP MỘ ] (Mộ bị Hợp nhả Dụng Thần ra) hoặc [ XUNG HÀO ] / [ XUNG MỘ ].\n`;
    	} else if (nguCanh === "phap_ly") {
        	res += `⚖️ CHIÊM PHÁP LÝ / CHỨC VỤ CƠ QUAN:\n`;
        	res += `  + Động hóa Quan Quỷ Mộ = kẹt ở đơn vị, cơ quan nhà nước / thủ tục pháp lý trói buộc.\n`;
        	res += `  + Lâm Đằng Xà = Tượng không gian nhỏ hẹp, xe lửa, đường dài trói buộc.\n`;
    	} else {
        	res += `📌 CHIÊM TỔNG QUÁT: Hào bị nhập Mộ tạm thời ẩn đi, vô lực sinh khắc. Phải chờ thời gian Xuất Mộ mới phát huy tác dụng.\n`;
    	}

    	res += `\n--- V. CÁC VÍ DỤ MINH HỌA THỰC CHIẾN (KHÚC VĨ) ---\n`;
    	res += `1. Quẻ Mông -> Sư (Nhật Tý, Tháng Mùi): Dần Mộc Hào 6 động bị Nguyệt Mùi thu Mộ -> Chưa thể khắc Tử Tôn Tuất Thổ, đồng thời Hào Biến Dậu Kim chưa thể Hồi Đầu Khắc Dần Mộc.\n`;
    	res += `2. Quẻ Khốn -> Tùy (Nhật Dần, Tháng Dần): Hào 2 Thìn Thổ động lẽ ra thu Hợi Thủy vào Mộ, nhưng bị Nhật/Nguyệt Dần Mộc khắc nát Thìn Thổ -> Thìn Thổ mất lực thu Mộ.\n`;
    	res += `3. Quổ Cổ -> Sư (Xem bệnh - Nhật Mùi, Tháng Thìn): Dần Mộc động hóa Dậu Kim khắc, bị Nhật Mùi thu Mộ -> Đến tháng Thân (Xung Dần Mộc ra khỏi Mộ) thì Dần Mộc lập tức bị Dậu Kim hồi đầu khắc qua đời.\n`;
    	res += `4. Quẻ Phong -> Chấn (Xem em về - Nhật Ngọ, Tháng Thân): Hợi Thủy động hóa Thìn Thổ (Động hóa Mộ) -> Đến ngày Dậu (Dậu Hợp Mộ Thìn), Thìn bị Hợp nhả Hợi Thủy ra -> Em trai về nhà an toàn.`;

    	// Lưu Data Mộ cấp trọng yếu cho các module sau
    	window.M03_DATA = {
        	danhSachHaoMo: danhSachHaoMo,
        	nguCanh: nguCanh,
        	tuTri: { nhat: B.tuTri.nhat, nhatChi: nhat, nguyet: B.tuTri.nguyet, nguyetChi: nguyet },
        	tuanKhongChi: kvChi.slice(),
        	phucThan: B.phucThan.slice(),
        	haoDong: cacHaoDong.slice()
    	};

    	const outputEl = document.getElementById("m03_Output");
    	const copyBtn = document.getElementById("m03_BtnCopy");

    	outputEl.value = res;
    	outputEl.style.display = "block";
    	copyBtn.style.display = "block";
	};

	// 4. Hàm Sao Chép Kết Quả Text Thuần
	window.copyModule03Text = function () {
    	const outputEl = document.getElementById("m03_Output");
    	if (!outputEl || !outputEl.value) return;

    	function showSuccess() {
        	const btn = document.getElementById("m03_BtnCopy");
        	btn.innerText = "✅ ĐÃ SAO CHÉP DATA MỘ (CẤP TRỌNG YẾU)!";
        	setTimeout(() => { btn.innerText = "📋 SAO CHÉP KẾT QUẢ MODULE 03 (DATA MỘ CẤP TRỌNG YẾU)"; }, 2000);
    	}

    	if (navigator.clipboard && navigator.clipboard.writeText) {
        	navigator.clipboard.writeText(outputEl.value).then(showSuccess).catch(() => {
            	outputEl.focus(); outputEl.select();
            	document.execCommand("copy");
            	showSuccess();
        	});
    	} else {
        	outputEl.focus(); outputEl.select();
        	document.execCommand("copy");
        	showSuccess();
    	}
	};

})();
