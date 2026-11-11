// =========================================================================
// MODULE 02: XỬ LÝ LỤC THẦN (THÚ) & TUẦN KHÔNG PHỤC TÀNG (m02.js)
// Tương thích 100% với Code Nền total.html & Quy ước Lục Hào Cổ Pháp
//
// CẦU NỐI DỮ LIỆU (bản vá): module tự động lấy dữ liệu có sẵn, không cần nhập lại:
//   • Code nền : Tứ Trị (Thời/Nhật/Nguyệt/Tuế), Họ Quẻ + Quẻ Chủ, Hào Động, Quẻ Biến
//   • m01.js   : Tuần Không đã khai báo (m01_tkChi1/2) + Phục Thần dưới từng Hào (m01_pt1..6)
// Thuật toán xử lý (An Lục Thần, quét Tuần Không, Phục Thần, Hào Biến) giữ nguyên.
// Các ô nhập ở module này chỉ còn là phần GHI ĐÈ / BỔ SUNG khi cần.
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

	// 1. Dữ liệu Can Chi & Lục Thần Cổ Pháp
	const CAN_DUONG = ["Giáp", "Bính", "Mậu", "Canh", "Nhâm"];
	const CAN_AM	= ["Ất", "Đinh", "Kỷ", "Tân", "Quý"];
	const CHI_DUONG = ["Tý", "Dần", "Thìn", "Ngọ", "Thân", "Tuất"];
	const CHI_AM	= ["Sửu", "Mão", "Tỵ", "Mùi", "Dậu", "Hợi"];
	const CAN_ALL = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
	const CHI_ALL = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
	const CYCLE_LUC_THAN = ["Thanh Long", "Chu Tước", "Câu Trần", "Đằng Xà", "Bạch Hổ", "Huyền Vũ"];

	// Bảng 6 Tuần Tuần Không (Không Vong)
	const KV_PAIRS = [
    	["Tuất", "Hợi"], // Group 0: Tuần Giáp Tý
    	["Thân", "Dậu"], // Group 1: Tuần Giáp Tuất
    	["Ngọ", "Mùi"],  // Group 2: Tuần Giáp Thân
    	["Thìn", "Tỵ"],  // Group 3: Tuần Giáp Ngọ
    	["Dần", "Mão"],  // Group 4: Tuần Giáp Thìn
    	["Tý", "Sửu"]	// Group 5: Tuần Giáp Dần
	];
	const TUAN_NAME = ["Giáp Tý", "Giáp Tuất", "Giáp Thân", "Giáp Ngọ", "Giáp Thìn", "Giáp Dần"];

	// Các cặp ô nhập của module <-> ô Tứ Trị tương ứng ở Code Nền
	const TUTRI_MAP = [
    	["m02_Thoi", "mThoi"],
    	["m02_Nhat", "mNhat"],
    	["m02_Nguyet", "mNguyet"],
    	["m02_ThaiTue", "mThaiTue"]
	];

	// 2. Tạo giao diện UI và chèn vào khung #module-slots của total.html
	const myModuleBox = moduleSlot(`
    	<div class="header" style="border-bottom: 1px solid var(--gold); padding: 5px 0 10px 0; margin-bottom: 15px;">
        	<h1 style="font-size: 1.1rem; color: var(--gold); margin: 0; text-transform: uppercase; text-align: center;">MODULE 02: Lục Thần &amp; Tuần Không Phục Tàng</h1>
    	</div>

    	<!-- Khai báo Tứ Trị với Bộ Đoán Từ Gợi Ý -->
    	<div style="font-size: 0.8rem; color: var(--gold); font-weight: bold; margin-bottom: 4px;">1. TỨ TRỊ (THỜI - NHẬT - NGUYỆT - TUẾ)</div>
    	<div style="font-size: 0.68rem; color: #888; margin-bottom: 8px;">Tự lấy từ Form Nền khi bấm xử lý. Chỉ gõ vào các ô dưới nếu muốn ghi đè (xoá ô để quay lại tự động).</div>
    	<div class="m-grid">
        	<div class="input-suggest-box">
            	<label>Thời (Giờ)</label>
            	<input type="text" id="m02_Thoi" placeholder="Tự lấy từ Form Nền" autocomplete="off" oninput="m02_SuggestGanChi(this, 'm02_sugThoi')">
            	<div id="m02_sugThoi" class="suggestions-list"></div>
        	</div>
        	<div class="input-suggest-box">
            	<label>Nhật Thần (Ngày - Khởi Lục Thần &amp; TK)</label>
            	<input type="text" id="m02_Nhat" placeholder="Tự lấy từ Form Nền" autocomplete="off" oninput="m02_SuggestGanChi(this, 'm02_sugNhat')">
            	<div id="m02_sugNhat" class="suggestions-list"></div>
        	</div>
    	</div>
    	<div class="m-grid">
        	<div class="input-suggest-box">
            	<label>Nguyệt Lệnh (Tháng)</label>
            	<input type="text" id="m02_Nguyet" placeholder="Tự lấy từ Form Nền" autocomplete="off" oninput="m02_SuggestGanChi(this, 'm02_sugNguyet')">
            	<div id="m02_sugNguyet" class="suggestions-list"></div>
        	</div>
        	<div class="input-suggest-box">
            	<label>Thái Tuế (Năm)</label>
            	<input type="text" id="m02_ThaiTue" placeholder="Tự lấy từ Form Nền" autocomplete="off" oninput="m02_SuggestGanChi(this, 'm02_sugThaiTue')">
            	<div id="m02_sugThaiTue" class="suggestions-list"></div>
        	</div>
    	</div>
    	<button class="btn-secondary" style="margin-bottom: 12px;" onclick="m02_DongBoTuNen()">↺ Đồng Bộ Lại Tứ Trị Từ Form Nền Ở Trên</button>

    	<!-- Khai báo Phục Thần Phục Tàng -->
    	<div style="font-size: 0.8rem; color: var(--gold); font-weight: bold; margin-top: 10px; margin-bottom: 4px;">2. PHỤC THẦN PHỤC TÀNG (BỔ SUNG THỦ CÔNG — TỐI ĐA 2)</div>
    	<div style="font-size: 0.68rem; color: #888; margin-bottom: 8px;">Phục Thần đã khai báo ở Module 1 được tự động lấy. Chỉ dùng 2 ô dưới để thêm Phục Thần khác.</div>
    	<div class="m-grid">
        	<div class="input-suggest-box">
            	<label>Phục Thần 1 (Tùy chọn)</label>
            	<select id="m02_Phuc1_Hao">
                	<option value="0">-- Chọn Hào Ẩn (PT 1) --</option>
                	<option value="1">Ẩn dưới Hào 1</option>
                	<option value="2">Ẩn dưới Hào 2</option>
                	<option value="3">Ẩn dưới Hào 3</option>
                	<option value="4">Ẩn dưới Hào 4</option>
                	<option value="5">Ẩn dưới Hào 5</option>
                	<option value="6">Ẩn dưới Hào 6</option>
            	</select>
        	</div>
        	<div class="input-suggest-box">
            	<label>Chi &amp; Lục Thân PT 1</label>
            	<input type="text" id="m02_Phuc1_Info" placeholder="Vd: Quan Quỷ Dậu" autocomplete="off">
        	</div>
    	</div>
    	<div class="m-grid">
        	<div class="input-suggest-box">
            	<label>Phục Thần 2 (Tùy chọn)</label>
            	<select id="m02_Phuc2_Hao">
                	<option value="0">-- Chọn Hào Ẩn (PT 2) --</option>
                	<option value="1">Ẩn dưới Hào 1</option>
                	<option value="2">Ẩn dưới Hào 2</option>
                	<option value="3">Ẩn dưới Hào 3</option>
                	<option value="4">Ẩn dưới Hào 4</option>
                	<option value="5">Ẩn dưới Hào 5</option>
                	<option value="6">Ẩn dưới Hào 6</option>
            	</select>
        	</div>
        	<div class="input-suggest-box">
            	<label>Chi &amp; Lục Thân PT 2</label>
            	<input type="text" id="m02_Phuc2_Info" placeholder="Vd: Thê Tài Mão" autocomplete="off">
        	</div>
    	</div>

    	<button class="m-btn-process" onclick="processModule02()">⚡ AN LỤC THẦN &amp; QUÉT TUẦN KHÔNG (M02)</button>
    	<textarea id="m02_Output" class="m-output-box" readonly onclick="this.select()"></textarea>
    	<button id="m02_BtnCopy" class="btn-copy" style="display:none; margin-top:10px;" onclick="copyModule02Text()">📋 SAO CHÉP KẾT QUẢ MODULE 02 (TEXT THUẦN)</button>
	`);

	// 3. Logic Đoán Từ Gợi Ý Can Chi Chuẩn Dương+Dương / Âm+Âm
	window.m02_SuggestGanChi = function(inputEl, sugId) {
    	const rawVal = inputEl.value.trim().toLowerCase();
    	const sugBox = document.getElementById(sugId);
    	sugBox.innerHTML = '';

    	// Có gõ tay = ghi đè dữ liệu tự động; xoá trống = quay lại tự động lấy từ Form Nền
    	inputEl.dataset.manual = rawVal ? "1" : "";

    	if (!rawVal) {
        	sugBox.style.display = 'none';
        	return;
    	}

    	// Loại bỏ dấu tiếng Việt cơ bản để tra gõ tắt (vd: Gia/Gi -> Giáp)
    	const normalizeStr = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    	const val = normalizeStr(rawVal);

    	let results = [];

    	// Kiểm tra Thiên Can Dương -> Ghép Địa Chi Dương
    	CAN_DUONG.forEach(can => {
        	if (normalizeStr(can).startsWith(val)) {
            	CHI_DUONG.forEach(chi => results.push(`${can} ${chi}`));
        	}
    	});

    	// Kiểm tra Thiên Can Âm -> Ghép Địa Chi Âm
    	CAN_AM.forEach(can => {
        	if (normalizeStr(can).startsWith(val)) {
            	CHI_AM.forEach(chi => results.push(`${can} ${chi}`));
        	}
    	});

    	if (results.length > 0) {
        	results.slice(0, 12).forEach(item => {
            	const div = document.createElement('div');
            	div.className = 'suggestion-item';
            	div.innerText = item;
            	div.onclick = function() {
                	inputEl.value = item;
                	sugBox.style.display = 'none';
            	};
            	sugBox.appendChild(div);
        	});
        	sugBox.style.display = 'block';
    	} else {
        	sugBox.style.display = 'none';
    	}
	};

	// Đổ Tứ Trị từ Form Nền vào các ô của module.
	// force = true : bỏ hết ghi đè tay, lấy lại toàn bộ từ Form Nền.
	// force = false: ô nào đang được gõ tay thì giữ nguyên.
	function syncTuTriFromBase(force) {
    	TUTRI_MAP.forEach(pair => {
        	const own = document.getElementById(pair[0]);
        	const base = document.getElementById(pair[1]);
        	if (!own || !base) return;
        	if (force) own.dataset.manual = "";
        	if (own.dataset.manual === "1") return;
        	own.value = base.value || "";
    	});
	}

	// Nút "Đồng bộ lại": luôn lấy lại Tứ Trị từ Form Nền
	window.m02_DongBoTuNen = function() {
    	syncTuTriFromBase(true);
	};

	// Helper tính vị trí Can Chi trong 60 Hoa Giáp
	function getGanChiIndex(canStr, chiStr) {
    	const canIdx = CAN_ALL.indexOf(canStr);
    	const chiIdx = CHI_ALL.indexOf(chiStr);
    	if (canIdx === -1 || chiIdx === -1) return -1;
    	for (let n = 0; n < 60; n++) {
        	if (n % 10 === canIdx && n % 12 === chiIdx) return n;
    	}
    	return -1;
	}

	// Helper xác định Lục Thần bắt đầu ở Hào 1 dựa vào Can Ngày
	function getStartDeityIndex(canStr) {
    	const canIdx = CAN_ALL.indexOf(canStr);
    	if (canIdx === 0 || canIdx === 1) return 0; // Giáp / Ất -> Thanh Long
    	if (canIdx === 2 || canIdx === 3) return 1; // Bính / Đinh -> Chu Tước
    	if (canIdx === 4) return 2;            	// Mậu -> Câu Trần
    	if (canIdx === 5) return 3;            	// Kỷ -> Đằng Xà
    	if (canIdx === 6 || canIdx === 7) return 4; // Canh / Tân -> Bạch Hổ
    	return 5;                              	// Nhâm / Quý -> Huyền Vũ
	}

	// 4. Hàm Thực Thi Logic Chính Của MODULE 02
	window.processModule02 = function () {
    	// Tự lấy Tứ Trị mới nhất từ Form Nền (ô nào gõ tay thì giữ nguyên)
    	syncTuTriFromBase(false);

    	const thoi = document.getElementById("m02_Thoi").value.trim();
    	const nhat = document.getElementById("m02_Nhat").value.trim();
    	const nguyet = document.getElementById("m02_Nguyet").value.trim();
    	const thaiTue = document.getElementById("m02_ThaiTue").value.trim();

    	const pt1Hao = parseInt(document.getElementById("m02_Phuc1_Hao").value);
    	const pt1Info = document.getElementById("m02_Phuc1_Info").value.trim();
    	const pt2Hao = parseInt(document.getElementById("m02_Phuc2_Hao").value);
    	const pt2Info = document.getElementById("m02_Phuc2_Info").value.trim();

    	if (!nhat) {
        	alert("Vui lòng nhập Nhật Thần (Ngày) ở Form Nền (phần Tứ Trị) hoặc ngay tại ô Nhật Thần của module này để làm căn cứ khởi Lục Thần & Tuần Không!");
        	return;
    	}

    	const nhatParts = nhat.split(/\s+/);
    	if (nhatParts.length < 2) {
        	alert("Nhật Thần phải có đủ Thiên Can và Địa Chi (Ví dụ: Giáp Tý, Kỷ Dậu...)!");
        	return;
    	}
    	const nhatCan = nhatParts[0];
    	const nhatChi = nhatParts[1];

    	// 1. Xác định Tuần Không theo Nhật Thần
    	const gcIndex = getGanChiIndex(nhatCan, nhatChi);
    	if (gcIndex === -1) {
        	alert("Tên Can Chi Ngày nhập vào không hợp lệ (Can Chi phải đúng quy tắc Âm-Âm, Dương-Dương)!");
        	return;
    	}
    	const groupTuan = Math.floor(gcIndex / 10);
    	const kvNhat = KV_PAIRS[groupTuan]; // 2 Chi Tuần Không tính từ Nhật
    	const tuanName = TUAN_NAME[groupTuan];

    	// ===== CẦU NỐI: gom toàn bộ dữ liệu từ Code Nền + m01 =====
    	const nhatGoTay = document.getElementById("m02_Nhat").dataset.manual === "1";
    	const B = window.LH_BRIDGE.collect(nhatGoTay ? { nhat: nhat } : {});

    	// Tuần Không: ưu tiên khai báo ở m01 -> ô Tuần Không code nền -> tính từ Nhật
    	const kvChi = B.tuanKhong.chi.length ? B.tuanKhong.chi : kvNhat;
    	const kvNguon = B.tuanKhong.chi.length ? B.tuanKhong.nguon : "tính từ Nhật Thần";
    	const kvText = kvChi.join(" ] và [ ");

    	// Phục Thần: tất cả Phục Thần khai báo ở m01 + tối đa 2 Phục Thần nhập tay tại module này
    	const ptList = B.phucThan.map(p => ({ hao: p.hao, info: p.info, chi: p.chi || window.LH_BRIDGE.findChi(p.info), nguon: "m01" }));
    	[[pt1Hao, pt1Info], [pt2Hao, pt2Info]].forEach(pair => {
        	const h = pair[0], info = pair[1];
        	if (h >= 1 && h <= 6 && info) {
            	const chi = window.LH_BRIDGE.findChi(info);
            	const trung = ptList.some(p => p.hao === h && p.chi && p.chi === chi);
            	if (!trung) ptList.push({ hao: h, info: info, chi: chi, nguon: "M02" });
        	}
    	});

    	// 2. An Lục Thần cho 6 Hào
    	const startDeityIdx = getStartDeityIndex(nhatCan);
    	const haoLucThan = {};
    	for (let h = 1; h <= 6; h++) {
        	haoLucThan[h] = CYCLE_LUC_THAN[(startDeityIdx + (h - 1)) % 6];
    	}

    	// 3. Quẻ từ Code Nền (qua cầu nối)
    	const que = B.que;
    	const dongArr = B.dong;

    	let res = `=== MODULE 02: KẾT QUẢ AN LỤC THẦN & QUÉT TUẦN KHÔNG (DATA CẤP 2) ===\n`;
    	res += `• Tứ Trị Lập Quẻ  	: Thời: ${thoi || "---"} | Nhật: ${nhat} | Nguyệt: ${nguyet || "---"} | Tuế: ${thaiTue || "---"}\n`;
    	res += `• Vòng Tuần Không 	: Tuần ${tuanName}  => TUẦN KHÔNG TẠI ĐỊA CHI: [ ${kvText} ]\n`;
    	res += `• Nguồn Tuần Không	: ${kvNguon}\n`;
    	if (B.tuanKhong.canhBao) {
        	res += `• ⚠️ Cảnh báo      	: ${B.tuanKhong.canhBao}\n`;
    	}
    	res += `• Khởi Lục Thần Ngày  : Can ${nhatCan} khởi ${CYCLE_LUC_THAN[startDeityIdx]} tại Hào 1\n`;
    	if (que) {
        	res += `• Quẻ Chủ         	: ${que.ten} (Họ ${que.cungName} - ${que.cungHanh})` + (que.bien ? ` -> Quẻ Biến: ${que.bien.ten}` : ``) + `\n`;
        	res += `• Hào Động        	: ${dongArr.length ? "Hào " + dongArr.join(", Hào ") : "QUẺ TĨNH (không có hào động)"}\n`;
    	}
    	res += `• Phục Thần       	: ${ptList.length ? ptList.map(p => `Hào ${p.hao}: ${p.info} (${p.nguon})`).join(" | ") : "Không có"}\n\n`;

    	res += `--- BẢNG CHI TIẾT LỤC THẦN & TRẠNG THÁI TUẦN KHÔNG CHO 6 HÀO ---\n`;
    	res += `Hào   | Lục Thần  	| Nạp Giáp (Quẻ Chính)    	| Trạng Thái Tuần Không\n`;
    	res += `-------------------------------------------------------------------------\n`;

    	let datasetShared = []; // Lưu trữ Data cấu trúc để chia sẻ cho các module khác

    	if (que) {
        	for (let i = 5; i >= 0; i--) {
            	const haoThu = i + 1;
            	const hl = que.haoList[i];
            	const napStr = hl.nap;
            	const chi = hl.chi;
            	const ltName = haoLucThan[haoThu];
            	const isDong = hl.isDong;
            	const isTK = kvChi.includes(chi);

            	let tkStatus = "---";
            	if (isTK) {
                	tkStatus = isDong ? "TUẦN KHÔNG (HÀO ĐỘNG)" : "TUẦN KHÔNG (HÀO TĨNH)";
            	}

            	// Kiểm tra xem Hào này có Phục Thần phục tàng bên dưới không
            	let ptNote = "";
            	const ptCuaHao = [];
            	ptList.forEach((p, idx) => {
                	if (p.hao !== haoThu) return;
                	const ptIsTK = !!p.chi && kvChi.includes(p.chi);
                	ptNote += `\n   	└─ [ Phục Thần ${idx + 1}: ${p.info} ]`
                    	+ (ptIsTK ? ` -> BỊ TUẦN KHÔNG!` : ``)
                    	+ (p.chi ? `` : ` (⚠️ chưa nhận ra Địa Chi)`);
                	ptCuaHao.push({ info: p.info, chi: p.chi, isTuanKhong: ptIsTK, nguon: p.nguon });
            	});

            	res += `Hào ${haoThu} | ${ltName.padEnd(13, ' ')} | ${napStr.padEnd(27, ' ')} | ${tkStatus}${ptNote}\n`;

            	datasetShared.push({
                	hao: haoThu,
                	lucThan: ltName,
                	napGiap: napStr,
                	chi: chi,
                	isDong: isDong,
                	isTuanKhong: isTK,
                	phucThanNote: ptNote,
                	phucThan: ptCuaHao
            	});
        	}
    	} else {
        	res += `(Chưa chọn Họ Quẻ & Quẻ Chủ ở phần trên. Vui lòng chọn Quẻ để hiển thị chi tiết nạp giáp!)\n`;
        	for (let h = 6; h >= 1; h--) {
            	res += `Hào ${h} | ${haoLucThan[h]}\n`;
        	}
        	if (ptList.length) {
            	res += `Phục Thần đã khai báo: ` + ptList.map(p => `Hào ${p.hao}: ${p.info}` + (p.chi && kvChi.includes(p.chi) ? ` (BỊ TUẦN KHÔNG)` : ``)).join(" | ") + `\n`;
        	}
    	}

    	// 4. Kiểm tra Hào Biến Lâm Tuần Không (Nếu có Quẻ Biến)
    	if (que && que.bien) {
        	res += `\n--- QUÉT TUẦN KHÔNG TẠI QUẺ BIẾN (HÀO BIẾN) ---\n`;
        	let coBienTK = false;
        	for (let i = 5; i >= 0; i--) {
            	const haoThu = i + 1;
            	const hb = que.bien.haoList[i];
            	const chiHanh = getChiHanh(hb.nap);
            	const chi = hb.chi;
            	if (kvChi.includes(chi)) {
                	coBienTK = true;
                	const isDongChinh = dongArr.includes(haoThu);
                	res += `• Quẻ Biến - Hào ${haoThu}: ${chiHanh} [Địa Chi: ${chi}] -> HÀO BIẾN LÂM TUẦN KHÔNG ${isDongChinh ? "(Phát sinh từ Hào Động)" : "(Hào Biến Tĩnh)"}\n`;
            	}
        	}
        	if (!coBienTK) {
            	res += `• Không có Hào Biến nào rơi vào Tuần Không.\n`;
        	}
    	}

    	res += `\n--- GHI CHÚ BẢO TỒN DATA CHO CÁC MODULE TIẾP THEO ---\n`;
    	res += `• Toàn bộ thông tin Lục Thần và vị trí Tuần Không (kể cả Phục Thần) đã được lưu vào bộ nhớ dùng chung window.M02_DATA.\n`;
    	res += `• Các module tiếp theo (m03 - m60) có thể truy xuất trực tiếp để thực hiện tính toán chuyên sâu.`;

    	// Lưu Data vào biến toàn cục window để các module sau dễ dàng truy cập
    	window.M02_DATA = {
        	nhatCan: nhatCan,
        	nhatChi: nhatChi,
        	tuanKhongChi: kvChi,
        	tuanKhongNguon: kvNguon,
        	tuanName: tuanName,
        	haoLucThan: haoLucThan,
        	dataset: datasetShared,
        	phucThan: ptList,
        	haoDong: dongArr.slice(),
        	tuTri: { thoi: thoi, nhat: nhat, nguyet: nguyet, thaiTue: thaiTue }
    	};

    	const outputEl = document.getElementById("m02_Output");
    	const copyBtn = document.getElementById("m02_BtnCopy");

    	outputEl.value = res;
    	outputEl.style.display = "block";
    	copyBtn.style.display = "block";
	};

	// 5. Hàm Sao Chép Kết Quả Text Thuần
	window.copyModule02Text = function () {
    	const outputEl = document.getElementById("m02_Output");
    	if (!outputEl || !outputEl.value) return;

    	function showSuccess() {
        	const btn = document.getElementById("m02_BtnCopy");
        	btn.innerText = "✅ ĐÃ SAO CHÉP DATA MODULE 02!";
        	setTimeout(() => { btn.innerText = "📋 SAO CHÉP KẾT QUẢ MODULE 02 (TEXT THUẦN)"; }, 2000);
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
