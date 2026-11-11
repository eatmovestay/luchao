/* =========================================================================
 * mchienluoc.js — MODULE CHIẾN LƯỢC (NÂNG CẤP)
 * -------------------------------------------------------------------------
 * MODE 1 — Luận Sinh Khắc Hào Động Đơn (giữ nguyên hành vi cũ):
 *   Gõ tên quẻ + chọn 1 hào động + (tuỳ) Dụng Thần → luận sinh-khắc.
 *
 * MODE 2 — Tìm Quẻ (mới):
 *   Chọn Dụng Thần (+ case Quan Cát/Hung) + khoảng thời gian A→B
 *   → quét 64 quẻ × (tĩnh | đúng 1 hào động 1..6) × mốc Tứ Trị
 *   → sơ khảo ~70% (Vượng/Suy + sinh-khắc + Lục Thần thú + hard Thế/Dụng)
 *   → Box Cân Nhắc (Tuần Không / Phá / Mộ) — chỉ thông tin, user tự cân.
 *
 * Tái dùng: dataDich, getHanh, tinhLucThan, findQueByCode, VUONG_SUY_TABLE,
 *   resolveVuongSuy, moduleSlot, calendar-core (NL_getDayContext),
 *   LH_BRIDGE / M02_DATA / M03_DATA / LucHaoModules.m06 khi có.
 * Load SAU m01–m08 trong total.html.
 * ========================================================================= */
(function () {
    "use strict";

    if (typeof dataDich === "undefined" || typeof moduleSlot !== "function") {
        console.error("mchienluoc.js: thiếu dataDich / moduleSlot của file gốc — module không chạy.");
        return;
    }

    /* ===================== HẰNG SỐ ===================== */
    const CHI_HANH = {
        "Tý": "Thủy", "Hợi": "Thủy", "Dần": "Mộc", "Mão": "Mộc",
        "Tỵ": "Hỏa", "Ngọ": "Hỏa", "Thân": "Kim", "Dậu": "Kim",
        "Sửu": "Thổ", "Thìn": "Thổ", "Mùi": "Thổ", "Tuất": "Thổ"
    };
    const CHI_LIST_LOCAL = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
    const SINH = { "Kim": "Thủy", "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim" };
    const KHAC = { "Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim" };
    const DUNG_THAN = ["Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ"];
    const ROLE_NAME = { T: "Thế", U: "Ứng", D: "Hào Động", B: "Hào Biến", Y: "Dụng Thần" };

    // An Lục Thần thú từ Can Nhật (cùng quy ước m02)
    const CYCLE_LUC_THAN = ["Thanh Long", "Chu Tước", "Câu Trần", "Đằng Xà", "Bạch Hổ", "Huyền Vũ"];
    const CAN_ALL = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];

    const SCORE_PASS = 70; // ngưỡng sơ khảo ~70%

    /* ===================== TIỆN ÍCH ===================== */
    function fold(s) {
        return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, " ").trim();
    }

    const ALL_QUE = [];
    Object.keys(dataDich).forEach(cungKey => {
        Object.keys(dataDich[cungKey].quẻ).forEach(qName => {
            ALL_QUE.push({
                name: qName, fold: fold(qName), cungKey: cungKey,
                cung: dataDich[cungKey], data: dataDich[cungKey].quẻ[qName]
            });
        });
    });

    function chiFromInput(id) {
        const el = document.getElementById(id);
        if (!el) return null;
        const toks = el.value.trim().split(/\s+/).reverse();
        for (const t of toks) {
            let c = t.normalize("NFC");
            if (c === "Tị") c = "Tỵ";
            if (CHI_LIST_LOCAL.indexOf(c) !== -1) return c;
        }
        return null;
    }

    function parseCanChi(str) {
        const t = String(str || "").normalize("NFC").trim().split(/\s+/).filter(Boolean);
        if (t.length >= 2) {
            let chi = t[1]; if (chi === "Tị") chi = "Tỵ";
            return { can: t[0], chi: chi };
        }
        if (t.length === 1) {
            let chi = t[0]; if (chi === "Tị") chi = "Tỵ";
            return { can: "", chi: CHI_LIST_LOCAL.indexOf(chi) >= 0 ? chi : "" };
        }
        return { can: "", chi: "" };
    }

    function startDeityIndex(canStr) {
        const i = CAN_ALL.indexOf(canStr);
        if (i === 0 || i === 1) return 0;
        if (i === 2 || i === 3) return 1;
        if (i === 4) return 2;
        if (i === 5) return 3;
        if (i === 6 || i === 7) return 4;
        if (i === 8 || i === 9) return 5;
        return 0;
    }

    function anLucThanThu(nhatCan) {
        const start = startDeityIndex(nhatCan);
        const map = {};
        for (let h = 1; h <= 6; h++) map[h] = CYCLE_LUC_THAN[(start + h - 1) % 6];
        return map;
    }

    /* ===================== VƯỢNG SUY → ĐIỂM SƠ KHẢO ===================== */
    function layCapVuongSuy(chi, chiTru, tenTru) {
        if (!chi || !chiTru) return { chuoi: null, cap: null, diem: 50 };
        if (typeof VUONG_SUY_TABLE === "undefined" || !VUONG_SUY_TABLE[chi] || !VUONG_SUY_TABLE[chi][chiTru]) {
            return { chuoi: null, cap: null, diem: 50 };
        }
        const raw = VUONG_SUY_TABLE[chi][chiTru];
        const chuoi = (typeof resolveVuongSuy === "function") ? resolveVuongSuy(raw, tenTru) : String(raw);
        let cap = "Huu", diem = 55;
        if (chuoi.indexOf("Vượng") >= 0) { cap = "Vuong"; diem = 90; }
        else if (chuoi.indexOf("Tướng") >= 0) { cap = "Tuong"; diem = 78; }
        else if (chuoi.indexOf("Hưu") >= 0) { cap = "Huu"; diem = 55; }
        else if (chuoi.indexOf("Tù") >= 0) { cap = "Tu"; diem = 35; }
        else if (chuoi.indexOf("Tử") >= 0) { cap = "Tu_status"; diem = 20; }
        return { chuoi: chuoi, cap: cap, diem: diem };
    }

    function mediumFromDiem(diem) {
        if (diem >= 70) return "Medium+";
        if (diem >= 55) return "Cận Medium";
        return "Dưới Medium";
    }

    /* ===================== PARSE HÀO ===================== */
    function parseLine(n, pos) {
        const clean = n.replace(/\(Thế\)|\(Ứng\)/g, "").trim();
        const w = clean.split(/\s+/);
        const chi = w[w.length - 2];
        const hanh = (typeof getHanh === "function" ? getHanh(w[w.length - 1]) : null) || CHI_HANH[chi] || "";
        return {
            pos: pos, lt: w.slice(0, -2).join(" "), chi: chi, hanh: hanh,
            the: /\(Thế\)/.test(n), ung: /\(Ứng\)/.test(n), isBien: false
        };
    }

    function relDir(a, b) {
        if (!a || !b || !a.hanh || !b.hanh) return { type: "none" };
        if (a.hanh === b.hanh) return { type: "hoa" };
        if (SINH[a.hanh] === b.hanh) return { from: "a", type: "sinh" };
        if (KHAC[a.hanh] === b.hanh) return { from: "a", type: "khac" };
        if (SINH[b.hanh] === a.hanh) return { from: "b", type: "sinh" };
        if (KHAC[b.hanh] === a.hanh) return { from: "b", type: "khac" };
        return { type: "none" };
    }

    function allowed(actor, target, type) {
        if (actor === "B") return ["T", "U", "D", "Y"].indexOf(target) !== -1 ? "ok" : "skip";
        if (actor === "D") {
            if (["T", "U", "Y"].indexOf(target) !== -1) return "ok";
            if (target === "B") return type === "sinh" ? "ok" : "noeffect";
            return "skip";
        }
        if (actor === "T") return ["U", "D", "Y"].indexOf(target) !== -1 ? "ok" : "skip";
        if (actor === "U") return ["T", "D", "Y"].indexOf(target) !== -1 ? "ok" : "skip";
        if (actor === "Y") return ["T", "U", "D", "B"].indexOf(target) !== -1 ? "ok" : "skip";
        return "skip";
    }

    const HOA_TEXT = "tỷ hòa (cùng ngũ hành): tiệm tiến, không bay như diều nhưng cũng không như thuyền gặp sóng";

    function meaning(a, t, type, ctx) {
        const cap = a === "B" ? "cấp 2" : "cấp 1";
        if (type === "hoa") return HOA_TEXT + ".";
        const key = a + ">" + t;
        switch (key) {
            case "T>U": return type === "sinh" ? "hao tổn, thất thoát, lòn cúi, quỵ lụy." : "có chút thuận lợi ban đầu.";
            case "U>T": return type === "khac" ? "không lợi từ khởi đầu đến kết thúc." : "có điểm thuận lợi, được giúp sức, được hỗ trợ.";
            case "D>T": case "B>T":
                return type === "khac" ? "biến động gây nguy hại (" + cap + (a === "B" ? ", lớn hơn cấp 1" : "") + ")."
                    : "biến động " + cap + " thuận lợi, nâng đỡ Chủ Thể.";
            case "D>U": case "B>U": {
                let s = type === "khac"
                    ? "biến động " + cap + " gây hại cho đối tượng/môi trường xung quanh Thế."
                    : "biến động " + cap + " sinh trợ cho đối tượng/điều kiện bên ngoài Thế.";
                if (ctx && ctx.UT === "Usinh") {
                    s += type === "khac" ? " Vì Ứng sinh Thế nên nguy hại này ảnh hưởng XẤU cho Thế."
                        : " Vì Ứng sinh Thế nên đồng minh được tiếp sức, có lợi cho Thế.";
                } else if (ctx && ctx.UT === "Ukhac") {
                    s += type === "khac" ? " Vì Ứng khắc Thế nay bị kìm bớt → chút TÍCH CỰC cho Thế."
                        : " Vì Ứng khắc Thế nên cản trở được tiếp lực, bất lợi cho Thế.";
                }
                return s;
            }
            case "T>D": return type === "sinh" ? "Thế phải sinh cho biến động cấp 1 = bỏ công mà lợi chẳng bao nhiêu." : "Thế chế ngự được biến động cấp 1.";
            case "U>D": return type === "sinh" ? "bên ngoài (Ứng) tiếp sức cho biến động cấp 1." : "bên ngoài (Ứng) kìm chế biến động cấp 1.";
            case "B>D": return type === "sinh" ? "biến động cấp 2 tiếp sức cho biến động cấp 1." : "biến động cấp 2 kìm chế/phá biến động cấp 1.";
            case "D>B": return type === "sinh" ? "biến động cấp 1 sinh sang biến động cấp 2." : "KHÔNG có hiệu lực: hào Động không thể khắc hào Biến.";
            case "D>Y": case "B>Y":
                return type === "sinh" ? "thuận lợi " + cap + " về đối tượng đang xét (Dụng Thần)." : "bất lợi " + cap + " về đối tượng đang xét (Dụng Thần).";
            case "Y>D": case "Y>B": {
                const c2 = t === "B" ? "cấp 2" : "cấp 1";
                return type === "sinh" ? "đối tượng cần xét sinh cho biến động " + c2 + "." : "đối tượng cần xét khắc/kìm chế biến động " + c2 + ".";
            }
            case "Y>T": return type === "sinh" ? "đối tượng cần xét sinh cho Chủ Thể = có lợi." : "đối tượng cần xét khắc Chủ Thể = bất lợi.";
            case "Y>U": return type === "sinh" ? "đối tượng cần xét sinh cho bên ngoài Chủ Thể." : "đối tượng cần xét khắc bên ngoài Chủ Thể.";
            case "T>Y": return type === "sinh" ? "Thế phải sinh cho đối tượng = bỏ công mà lợi chẳng bao nhiêu." : "Thế khắc đối tượng: chế ngự được, có chút thuận lợi.";
            case "U>Y": return type === "sinh" ? "điều kiện bên ngoài sinh trợ đối tượng đang xét." : "điều kiện bên ngoài khắc/cản trở đối tượng đang xét.";
            default: return "";
        }
    }

    /* ===================== UI ===================== */
    const boxHtml = `
        <div class="header" style="border-bottom: 1px solid var(--gold); padding: 5px 0 10px 0; margin-bottom: 15px;">
            <h1 style="font-size: 1.1rem;">Module Chiến Lược — Luận &amp; Tìm Quẻ</h1>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:14px;">
            <button type="button" class="btn-secondary" id="mcl_tabLuan" style="flex:1;margin:0;">⚔️ Luận 1 quẻ</button>
            <button type="button" class="btn-secondary" id="mcl_tabTim" style="flex:1;margin:0;">🔍 Tìm Quẻ (≤1 hào động)</button>
        </div>

        <!-- ========== MODE 1: LUẬN ========== -->
        <div id="mcl_panelLuan">
            <p style="font-size:0.72rem;color:#888;margin:0 0 12px;">
                Gõ Tên Quẻ (tự gợi ý, tự nhận Họ Quẻ), chọn 1 Hào Động và Dụng Thần (tuỳ chọn) — kết quả tự hiện.
                Vượng Suy lấy theo Nhật / Nguyệt ở phần Lập Thời phía trên.
            </p>
            <div class="input-suggest-box">
                <label>Tên Quẻ (gõ không dấu cũng được)</label>
                <input type="text" id="mcl_que" placeholder="vd: Thiên Phong Cấu / thien phong cau..." autocomplete="off">
                <div id="mcl_sug" class="suggestions-list"></div>
            </div>
            <div id="mcl_hoInfo" style="font-size:0.75rem;color:#888;margin:-4px 0 12px;">Họ Quẻ: —</div>
            <div class="m-grid">
                <div>
                    <label>Hào Động (chỉ 1 hào)</label>
                    <select id="mcl_hao">
                        <option value="">-- Chọn Hào --</option>
                        <option value="1">Hào 1</option><option value="2">Hào 2</option>
                        <option value="3">Hào 3</option><option value="4">Hào 4</option>
                        <option value="5">Hào 5</option><option value="6">Hào 6</option>
                    </select>
                </div>
                <div>
                    <label>Dụng Thần</label>
                    <select id="mcl_dt">
                        <option value="">-- Chưa chọn --</option>
                        ${DUNG_THAN.map(d => `<option value="${d}">${d}</option>`).join("")}
                    </select>
                </div>
            </div>
            <button class="m-btn-process" id="mcl_runBtn">⚔️ LUẬN GIẢI</button>
            <textarea id="mcl_output" class="m-output-box" readonly></textarea>
            <button class="btn-copy" id="mcl_copyBtn" style="display:none;">📋 SAO CHÉP KẾT QUẢ</button>
            <div class="fallback-box" id="mcl_fallbackBox">
                <textarea id="mcl_fallbackText" readonly></textarea>
                <div class="fallback-hint">Trình duyệt chặn copy tự động — bấm vào ô trên để chọn hết rồi copy thủ công</div>
            </div>
        </div>

        <!-- ========== MODE 2: TÌM QUẺ ========== -->
        <div id="mcl_panelTim" style="display:none;">
            <p style="font-size:0.72rem;color:#888;margin:0 0 12px;line-height:1.45;">
                Chọn <b>Dụng Thần</b> quan tâm + khoảng thời gian. Máy quét 64 quẻ × (tĩnh hoặc đúng 1 hào động),
                sơ khảo ~70% (Vượng/Suy, sinh-khắc, Lục Thần thú, hard gate Thế &amp; Dụng).
                Tuần Không / Phá / Mộ chỉ đưa vào <b>Box Cân Nhắc</b> — user tự cân trọng số cuối.
            </p>

            <label>Dụng Thần cần tìm</label>
            <select id="mcl_tim_dt">
                <option value="">-- Chọn Dụng Thần --</option>
                ${DUNG_THAN.map(d => `<option value="${d}">${d}</option>`).join("")}
            </select>

            <div id="mcl_tim_quanBox" style="display:none;margin:8px 0 12px;padding:10px;border:1px solid #444;border-radius:8px;">
                <label style="margin:0 0 6px;">Case Quan Quỷ</label>
                <select id="mcl_tim_quanCase">
                    <option value="cat">Cát thần — cần Quan có khí; không lâm Bạch Hổ</option>
                    <option value="hung">Hung thần — không muốn Quan có lực; bắt buộc lâm Thanh Long; ưu tiên không phát động</option>
                </select>
            </div>

            <label style="margin-top:8px;">Nguồn Tứ Trị</label>
            <select id="mcl_tim_nguonTime">
                <option value="form">Dùng Tứ Trị đang nhập ở Form Nền (1 mốc)</option>
                <option value="range">Khoảng Dương lịch A → B (calendar-core, nếu có)</option>
            </select>

            <div id="mcl_tim_rangeBox" style="display:none;margin-top:10px;">
                <div class="m-grid">
                    <div>
                        <label>Từ ngày (D/M/YYYY)</label>
                        <input type="text" id="mcl_tim_from" placeholder="vd: 1/11/2026">
                    </div>
                    <div>
                        <label>Đến ngày (D/M/YYYY)</label>
                        <input type="text" id="mcl_tim_to" placeholder="vd: 15/11/2026">
                    </div>
                </div>
                <div class="m-grid">
                    <div>
                        <label>Giờ Chi (cố định khi quét khoảng)</label>
                        <select id="mcl_tim_gio">
                            <option value="">-- Không cố định --</option>
                            ${CHI_LIST_LOCAL.map(c => `<option value="${c}">${c}</option>`).join("")}
                        </select>
                    </div>
                    <div>
                        <label>Bước quét</label>
                        <select id="mcl_tim_step">
                            <option value="1">Mỗi ngày</option>
                            <option value="3">Mỗi 3 ngày</option>
                            <option value="7">Mỗi 7 ngày</option>
                        </select>
                    </div>
                </div>
                <p style="font-size:0.68rem;color:#888;margin:6px 0 0;">Phạm vi Tiết Khí calendar-core: 2023–2046. Khoảng dài + bước 1 ngày sẽ chậm hơn.</p>
            </div>

            <div class="m-grid" style="margin-top:10px;">
                <div>
                    <label>Hào động xét</label>
                    <select id="mcl_tim_haoMode">
                        <option value="all">Tĩnh + cả 6 vị trí (1 hào)</option>
                        <option value="dong_only">Chỉ cấu hình có đúng 1 hào động</option>
                        <option value="tinh_only">Chỉ quẻ tĩnh</option>
                        <option value="1">Chỉ động Hào 1</option>
                        <option value="2">Chỉ động Hào 2</option>
                        <option value="3">Chỉ động Hào 3</option>
                        <option value="4">Chỉ động Hào 4</option>
                        <option value="5">Chỉ động Hào 5</option>
                        <option value="6">Chỉ động Hào 6</option>
                    </select>
                </div>
                <div>
                    <label>Ngưỡng sơ khảo (điểm)</label>
                    <input type="number" id="mcl_tim_threshold" value="70" min="50" max="95" style="width:100%;padding:10px;border-radius:8px;border:1px solid #444;background:#252525;color:#fff;box-sizing:border-box;">
                </div>
            </div>

            <label style="display:block;margin-top:10px;font-size:0.75rem;">
                <input type="checkbox" id="mcl_tim_requireCleanBox"> Ưu tiên / chỉ hiện ứng viên Box Cân Nhắc “sạch” (không cờ Không–Phá–Mộ đã biết)
            </label>

            <button class="m-btn-process" id="mcl_tim_runBtn">🔍 TÌM QUẺ ĐẠT SƠ KHẢO</button>
            <div id="mcl_tim_status" style="font-size:0.75rem;color:#888;margin:6px 0;"></div>

            <!-- Menu xem kết quả: Tên Quẻ XOR Xem List -->
            <div id="mcl_tim_viewBar" style="display:none;margin:10px 0;padding:10px;border:1px solid #444;border-radius:8px;">
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                    <button type="button" class="btn-secondary" id="mcl_tim_modeTen" style="margin:0;flex:1;">📜 Menu Tên Quẻ (BẬT)</button>
                    <button type="button" class="btn-secondary" id="mcl_tim_modeList" style="margin:0;flex:1;opacity:0.55;">📑 Menu Xem List (TẮT)</button>
                </div>
                <div id="mcl_tim_tenBox">
                    <label>Chọn tên quẻ đã tìm được</label>
                    <select id="mcl_tim_tenSelect">
                        <option value="">-- Tất cả (rút gọn) --</option>
                    </select>
                    <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
                        <button type="button" class="btn-secondary" id="mcl_tim_tenShow" style="margin:0;">Xem chi tiết quẻ đã chọn</button>
                        <button type="button" class="btn-secondary" id="mcl_tim_tenNext40" style="margin:0;display:none;">Xem Tiếp (41…)</button>
                    </div>
                </div>
                <div id="mcl_tim_listBox" style="display:none;margin-top:4px;">
                    <label>Chọn List (mỗi list tối đa 10 quẻ)</label>
                    <select id="mcl_tim_listSelect">
                        <option value="0">List 1 (quẻ 1–10)</option>
                    </select>
                    <button type="button" class="btn-secondary" id="mcl_tim_listShow" style="margin:8px 0 0;">Xem List đã chọn</button>
                </div>
            </div>

            <textarea id="mcl_tim_output" class="m-output-box" readonly></textarea>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
                <button class="btn-copy" id="mcl_tim_copyBtn" style="display:none;margin:0;">📋 SAO CHÉP KẾT QUẢ TÌM QUẺ</button>
                <button class="btn-copy" id="mcl_tim_statsBtn" style="display:none;margin:0;">📊 THỐNG KÊ (.txt) — Tải xuống</button>
            </div>
            <div class="fallback-box" id="mcl_tim_fallbackBox">
                <textarea id="mcl_tim_fallbackText" readonly></textarea>
                <div class="fallback-hint">Trình duyệt chặn copy — chọn hết ô trên rồi Ctrl+C</div>
            </div>
        </div>
    `;

    const box = moduleSlot(boxHtml);
    const $ = (id) => box.querySelector("#" + id);

    $("mcl_output").addEventListener("click", function () { this.select(); });
    $("mcl_fallbackText").addEventListener("click", function () { this.select(); });
    $("mcl_tim_output").addEventListener("click", function () { this.select(); });
    $("mcl_tim_fallbackText").addEventListener("click", function () { this.select(); });

    /* ----- Tab ----- */
    function showTab(which) {
        $("mcl_panelLuan").style.display = which === "luan" ? "block" : "none";
        $("mcl_panelTim").style.display = which === "tim" ? "block" : "none";
        $("mcl_tabLuan").style.opacity = which === "luan" ? "1" : "0.6";
        $("mcl_tabTim").style.opacity = which === "tim" ? "1" : "0.6";
    }
    $("mcl_tabLuan").addEventListener("click", () => showTab("luan"));
    $("mcl_tabTim").addEventListener("click", () => showTab("tim"));
    showTab("luan");

    $("mcl_tim_dt").addEventListener("change", function () {
        $("mcl_tim_quanBox").style.display = this.value === "Quan Quỷ" ? "block" : "none";
    });
    $("mcl_tim_nguonTime").addEventListener("change", function () {
        $("mcl_tim_rangeBox").style.display = this.value === "range" ? "block" : "none";
    });

    /* ===================== MODE 1: gõ quẻ ===================== */
    let selectedQue = null;

    function matchQue(text) {
        const f = fold(text);
        if (!f) return [];
        const exact = ALL_QUE.filter(q => q.fold === f);
        if (exact.length) return exact;
        const toks = f.split(" ");
        return ALL_QUE.filter(q => toks.every(t => q.fold.indexOf(t) !== -1));
    }
    function hideSuggest() { $("mcl_sug").style.display = "none"; }
    function setQue(q) {
        selectedQue = q;
        if (q) {
            $("mcl_que").value = q.name;
            $("mcl_hoInfo").innerHTML = "Họ Quẻ: <b style=\"color:var(--gold)\">Họ " + q.cung.name + " (" + q.cung.hanh + ")</b>";
        } else {
            $("mcl_hoInfo").textContent = "Họ Quẻ: —";
        }
    }
    function resolveQue() {
        if (selectedQue && fold(selectedQue.name) === fold($("mcl_que").value)) return selectedQue;
        const m = matchQue($("mcl_que").value);
        if (m.length === 1) { setQue(m[0]); return m[0]; }
        setQue(null);
        return null;
    }
    function onQueInput() {
        const m = matchQue($("mcl_que").value);
        const sug = $("mcl_sug");
        sug.innerHTML = "";
        if (!$("mcl_que").value.trim() || !m.length) { hideSuggest(); setQue(null); return; }
        m.slice(0, 12).forEach(q => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.textContent = q.name + "  —  Họ " + q.cung.name;
            div.addEventListener("mousedown", function (ev) {
                ev.preventDefault();
                setQue(q);
                hideSuggest();
                autoRun();
            });
            sug.appendChild(div);
        });
        sug.style.display = "block";
        if (m.length === 1 && m[0].fold === fold($("mcl_que").value)) { setQue(m[0]); hideSuggest(); autoRun(); }
        else setQue(null);
    }
    $("mcl_que").addEventListener("input", onQueInput);
    $("mcl_que").addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
            const m = matchQue(this.value);
            if (m.length >= 1) { setQue(m[0]); hideSuggest(); autoRun(); }
            ev.preventDefault();
        }
    });
    document.addEventListener("click", function (ev) { if (!box.contains(ev.target)) hideSuggest(); });

    /* ===================== MODE 1: luận giải (giữ logic cũ) ===================== */
    function luanGiai(silent, opts) {
        const q = opts ? opts.que : resolveQue();
        const h = opts ? Number(opts.hao) : Number($("mcl_hao").value);
        if (!q || !h) {
            if (opts) return { ok: false, loi: "Thiếu Quẻ hoặc Hào Động." };
            if (!silent) alert("Vui lòng gõ/chọn Tên Quẻ hợp lệ và chọn đúng 1 Hào Động.");
            return;
        }
        const dtChon = opts ? (opts.dt || "") : $("mcl_dt").value;
        const chu = q.data;
        const i = h - 1;
        const dataWarn = [];

        const lines = chu.n.map((n, k) => parseLine(n, k + 1));
        lines.forEach(l => {
            if (CHI_HANH[l.chi] && l.hanh !== CHI_HANH[l.chi]) {
                dataWarn.push("Hào " + l.pos + ": hành trong data (" + l.hanh + ") không khớp địa chi " + l.chi);
            }
        });
        const T = lines.find(l => l.the);
        const U = lines.find(l => l.ung);
        const D = lines[i];
        if (!T || !U) {
            if (opts) return { ok: false, loi: "Dữ liệu quẻ thiếu đánh dấu Thế/Ứng." };
            alert("Dữ liệu quẻ này thiếu đánh dấu Thế/Ứng — kiểm tra lại data.");
            return;
        }

        const arr = chu.c.split("");
        const bit = 6 - h;
        arr[bit] = arr[bit] === "1" ? "0" : "1";
        const qb = (typeof findQueByCode === "function") ? findQueByCode(arr.join("")) : null;
        let B = null;
        if (qb && qb.data) {
            const nb = qb.data.n[i].replace(/\(Thế\)|\(Ứng\)/g, "").trim().split(/\s+/);
            const chiB = nb[nb.length - 2];
            const hanhB = (typeof getHanh === "function" ? getHanh(nb[nb.length - 1]) : null) || CHI_HANH[chiB] || "";
            const ltB = (typeof tinhLucThan === "function")
                ? tinhLucThan(hanhB, q.cung.hanh)
                : nb.slice(0, -2).join(" ");
            B = { pos: h, chi: chiB, hanh: hanhB, lt: ltB, isBien: true, the: false, ung: false };
        }

        const nhatChi = chiFromInput("mNhat");
        const nguyetChi = chiFromInput("mNguyet");
        function vuongSuy(e) {
            if (!e || !e.chi) return null;
            const parts = [];
            if (nhatChi) {
                const vs = layCapVuongSuy(e.chi, nhatChi, "Nhật");
                if (vs.chuoi) parts.push("Nhật: " + vs.chuoi);
            }
            if (nguyetChi) {
                const vs = layCapVuongSuy(e.chi, nguyetChi, "Nguyệt");
                if (vs.chuoi) parts.push("Nguyệt: " + vs.chuoi);
            }
            return parts.length ? parts.join(" | ") : null;
        }
        function L(e) {
            return (e.lt ? e.lt + " " : "") + e.chi + (e.hanh ? " " + e.hanh : "") + (e.pos ? " (H" + e.pos + ")" : "");
        }

        // Dụng Thần
        const Ys = [];
        let yFromBien = false;
        if (dtChon) {
            lines.forEach(l => { if (l.lt === dtChon) Ys.push(l); });
            if (!Ys.length && B && B.lt === dtChon) { Ys.push(B); yFromBien = true; }
        }

        let text = "=== LUẬN SINH KHẮC HÀO ĐỘNG ĐƠN ===\n";
        text += "Quẻ Chính: " + q.name + " (Họ " + q.cung.name + " - " + q.cung.hanh + ")\n";
        if (qb) text += "Quẻ Biến: " + qb.name + "\n";
        text += "Hào Động: Hào " + h + " — " + L(D) + "\n";
        if (B) text += "Hào Biến: " + L(B) + "\n";
        text += "Thế: " + L(T) + (vuongSuy(T) ? " → " + vuongSuy(T) : "") + "\n";
        text += "Ứng: " + L(U) + (vuongSuy(U) ? " → " + vuongSuy(U) : "") + "\n";
        if (dtChon) {
            if (Ys.length) {
                Ys.forEach(y => {
                    text += "• Dụng Thần " + dtChon + ": " + L(y) + (y.isBien ? " [từ Hào Biến]" : "") + (vuongSuy(y) ? " → " + vuongSuy(y) : "") + "\n";
                });
            } else {
                text += "• Dụng Thần " + dtChon + ": ❌ KHÔNG XUẤT HIỆN (Chính + Biến)\n";
            }
        }
        if (!nhatChi && !nguyetChi) text += "(Chưa nhập Nhật/Nguyệt ở Lập Thời → chưa có Vượng Suy.)\n";
        if (dataWarn.length) text += "Cảnh báo data: " + dataWarn.join("; ") + "\n";

        const roles = [{ r: "T", e: T }, { r: "U", e: U }, { r: "D", e: D }];
        if (B) roles.push({ r: "B", e: B });
        Ys.forEach(y => { if (!y.isBien) roles.push({ r: "Y", e: y }); });
        const sameLine = (x, y) => !x.e.isBien && !y.e.isBien && x.e.pos === y.e.pos;

        const relUT = relDir(U, T);
        const ctx = {
            UT: relUT.type === "hoa" ? "hoa"
                : (relUT.from === "a" ? (relUT.type === "sinh" ? "Usinh" : "Ukhac")
                    : (relUT.type === "sinh" ? "Tsinh" : "Tkhac"))
        };

        const PAIR_GROUPS = [
            { title: "THẾ ↔ ỨNG", pairs: [["T", "U"]] },
            { title: "HÀO ĐỘNG (cấp 1) ↔ THẾ / ỨNG", pairs: [["D", "T"], ["D", "U"]] },
            { title: "HÀO BIẾN (cấp 2) ↔ THẾ / ỨNG / HÀO ĐỘNG", pairs: [["B", "T"], ["B", "U"], ["B", "D"]] },
            { title: "DỤNG THẦN ĐỘC LẬP ↔ CÁC HÀO", pairs: [["T", "Y"], ["U", "Y"], ["D", "Y"], ["B", "Y"]] }
        ];

        const E = [];
        let body = "";
        PAIR_GROUPS.forEach(g => {
            let gText = "";
            g.pairs.forEach(pr => {
                roles.filter(x => x.r === pr[0]).forEach(x => {
                    roles.filter(y => y.r === pr[1]).forEach(y => {
                        if (sameLine(x, y)) return;
                        const rd = relDir(x.e, y.e);
                        if (rd.type === "none") return;
                        let actor, target, type;
                        if (rd.type === "hoa") {
                            if ((x.r === "B" && (y.r === "T" || y.r === "U")) || (y.r === "B" && (x.r === "T" || x.r === "U"))) return;
                            actor = x; target = y; type = "hoa";
                        } else {
                            actor = rd.from === "a" ? x : y;
                            target = rd.from === "a" ? y : x;
                            type = rd.type;
                            const al = allowed(actor.r, target.r, type);
                            if (al === "skip") return;
                            if (al === "noeffect") {
                                gText += "• [" + ROLE_NAME[actor.r] + "] " + L(actor.e) + "  KHẮC  [" + ROLE_NAME[target.r] + "] " + L(target.e) +
                                    "\n    → " + meaning(actor.r, target.r, type, ctx) + "\n";
                                return;
                            }
                        }
                        E.push({ a: actor.r, ae: actor.e, t: target.r, te: target.e, type: type });
                        const verb = type === "sinh" ? "SINH" : type === "khac" ? "KHẮC" : "TỶ HÒA với";
                        gText += "• [" + ROLE_NAME[actor.r] + "] " + L(actor.e) + "  " + verb + "  [" + ROLE_NAME[target.r] + "] " + L(target.e) +
                            "\n    → " + meaning(actor.r, target.r, type, ctx) + "\n";
                    });
                });
            });
            if (gText) body += "\n" + g.title + "\n" + gText;
        });

        let sameNote = "";
        if (T.hanh === U.hanh) {
            ["D", "B"].forEach(r => {
                const x = roles.find(o => o.r === r);
                if (!x) return;
                if (!x.e.isBien && (x.e.pos === T.pos || x.e.pos === U.pos)) return;
                const rd = relDir(x.e, T);
                if (rd.type === "hoa" || rd.from !== "a") return;
                const cap = r === "B" ? "cấp 2" : "cấp 1";
                sameNote += "• Thế & Ứng cùng ngũ hành (" + T.hanh + ") và cùng " + (rd.type === "sinh" ? "được " : "bị ") + ROLE_NAME[r] + " " +
                    (rd.type === "sinh" ? "sinh" : "khắc") + " → biến động " + cap + (rd.type === "sinh" ? " THUẬN LỢI." : " BẤT LỢI, NGUY HẠI.") + "\n";
            });
        }
        if (sameNote) body += "\nTHẾ & ỨNG CÙNG NGŨ HÀNH\n" + sameNote;

        text += "\n[2] SINH – KHẮC – TỶ HÒA GIỮA CÁC HÀO (theo ngũ hành Địa Chi)\n";
        text += body || "(Không có quan hệ nào để liệt kê)\n";

        const toT = E.filter(x => x.t === "T" && x.type !== "hoa");
        const sinhIn = toT.filter(x => x.type === "sinh");
        const khacIn = toT.filter(x => x.type === "khac");
        const listActors = (arr) => arr.length ? arr.map(x => ROLE_NAME[x.a] + " " + x.ae.chi).join(", ") : "không có";

        let s1 = 0, nguyHiem = false;
        if (khacIn.length === 0) s1 = sinhIn.length > 0 ? 1 : 0;
        else if (sinhIn.length > khacIn.length) s1 = 1;
        else if (sinhIn.length === khacIn.length) s1 = 0;
        else { s1 = -1; if (khacIn.length >= 2) nguyHiem = true; }

        let s21 = 0, t21 = "";
        const eUT = E.find(x => (x.a === "U" && x.t === "T") || (x.a === "T" && x.t === "U"));
        if (eUT) {
            if (eUT.type === "hoa") { s21 = 0; t21 = "Thế tỷ hòa Ứng — tiệm tiến."; }
            else if (eUT.a === "U" && eUT.type === "khac") { s21 = -1; t21 = "Ứng khắc Thế — bị phá rối."; }
            else if (eUT.a === "T" && eUT.type === "sinh") { s21 = -1; t21 = "Thế sinh Ứng — hao tổn, bị phá rối."; }
            else if (eUT.a === "U" && eUT.type === "sinh") { s21 = 1; t21 = "Ứng sinh Thế — ít bị phá rối, được hỗ trợ."; }
            else { s21 = 1; t21 = "Thế khắc Ứng — ít bị phá rối, có chút thuận lợi ban đầu."; }
        }

        const dbToT = E.filter(x => x.t === "T" && (x.a === "D" || x.a === "B") && x.type !== "hoa");
        const dbKhac = dbToT.filter(x => x.type === "khac");
        const s22 = dbKhac.length ? -1 : 1;
        const t22 = dbKhac.length
            ? "bị " + dbKhac.map(x => ROLE_NAME[x.a] + " " + x.ae.chi + " (" + (x.a === "B" ? "cấp 2" : "cấp 1") + ")").join(", ") + " khắc."
            : "không bị Hào Động / Hào Biến khắc" + (dbToT.length ? " (còn được " + dbToT.map(x => ROLE_NAME[x.a]).join(", ") + " sinh)." : ".");

        const yList = Ys.slice();
        if (yFromBien && B) yList.push(B);
        const st23 = []; const tx23 = []; let hoaY = false;
        yList.forEach(y => {
            if (!y.isBien && y.pos === T.pos) { tx23.push("Dụng Thần chính là Thế."); return; }
            const rd = relDir(y, T);
            const yn = y.isBien ? "Hào Biến " + y.chi : "Hào " + y.pos + " " + y.chi;
            if (rd.type === "hoa") {
                if (y.isBien) { tx23.push(yn + " (Dụng là Biến) không xét tỷ hòa với Thế."); return; }
                hoaY = true; tx23.push("Thế tỷ hòa Dụng Thần (" + yn + ")."); return;
            }
            if (y.isBien && rd.from !== "a") { tx23.push("Dụng là Hào Biến nên Thế không tác động lên nó."); return; }
            if (rd.from === "a") {
                if (rd.type === "sinh") { st23.push(1); tx23.push("Dụng (" + yn + ") sinh Thế — có lợi."); }
                else { st23.push(-1); tx23.push("Dụng (" + yn + ") khắc Thế — bất lợi."); }
            } else {
                if (rd.type === "sinh") { st23.push(-1); tx23.push("Thế sinh Dụng (" + yn + ") — bỏ công."); }
                else { st23.push(1); tx23.push("Thế khắc Dụng (" + yn + ") — chế ngự được."); }
            }
        });
        let s23 = 0;
        if (st23.length) {
            const g = st23.filter(v => v > 0).length, b = st23.filter(v => v < 0).length;
            s23 = b === 0 ? 1 : (g === 0 ? -1 : 0);
        }
        const s24 = hoaY ? 1 : 0;
        const mark = (s) => s > 0 ? "✔" : s < 0 ? "✘" : "⚖";

        text += "\n[3] NỀN TẢNG CỦA CHỦ THỂ (THẾ)\n";
        text += mark(s1) + " Nền tảng 1 — Thế ổn: được sinh [" + listActors(sinhIn) + "]; bị khắc [" + listActors(khacIn) + "].\n";
        if (nguyHiem) text += "   🚨 CẢNH BÁO: NGUY HIỂM — Thế bị khắc nhiều mà cái sinh ít.\n";
        text += mark(s21) + " Nền tảng 2.1 — Thế ít bị Ứng phá rối: " + (t21 || "không có dữ liệu.") + "\n";
        text += mark(s22) + " Nền tảng 2.2 — Thế ít/không bị Động/Biến khắc: " + t22 + "\n";
        if (!dtChon) text += "— Nền tảng 2.3 / 2.4 — chưa chọn Dụng Thần.\n";
        else if (!yList.length) text += "— Nền tảng 2.3 / 2.4 — Dụng không xuất hiện.\n";
        else {
            text += mark(s23) + " Nền tảng 2.3 — Thế / Dụng sinh-khắc: " + (tx23.filter(t => !/tỷ hòa/.test(t)).join(" ") || "không đáng kể.") + "\n";
            text += mark(s24) + " Nền tảng 2.4 — Thế tỷ hòa Dụng: " + (hoaY ? "có." : "không.") + "\n";
        }

        const theSinh = E.filter(x => x.a === "T" && x.type === "sinh");
        const theHoa = E.filter(x => x.type === "hoa" && (x.a === "T" || x.t === "T"));
        text += "\nTình trạng Thế:\n";
        let anyCase = false;
        if (theSinh.length) { anyCase = true; text += "• Thế SINH cho [" + theSinh.map(x => ROLE_NAME[x.t] + " " + x.te.chi).join(", ") + "] = bỏ công.\n"; }
        if (khacIn.length) { anyCase = true; text += "• Thế bị [" + khacIn.map(x => ROLE_NAME[x.a] + " " + x.ae.chi).join(", ") + "] KHẮC = nguy hại.\n"; }
        if (theHoa.length) { anyCase = true; text += "• Thế tỷ hòa với [" + theHoa.map(x => ROLE_NAME[x.a === "T" ? x.t : x.a] + " " + (x.a === "T" ? x.te.chi : x.ae.chi)).join(", ") + "].\n"; }
        if (!anyCase) text += "• Thế không bị tác động đáng kể.\n";

        const eTD = E.find(x => x.a === "T" && x.t === "D" && x.type === "sinh");
        const s25 = eTD ? -1 : 0;
        if (eTD) text += "✘ Nền tảng phụ — Thế sinh Hào Động (bỏ công).\n";
        const others = [s21, s22, s25].concat(dtChon && yList.length ? [s23, s24] : []);
        const goods = others.filter(v => v > 0).length;
        const bads = others.filter(v => v < 0).length;
        let verdict;
        if (nguyHiem) verdict = "🚨 NGUY HIỂM — TIÊU CỰC, dễ THẤT BẠI.";
        else if (s1 < 0) verdict = "❌ TIÊU CỰC — NGUY HẠI (nền tảng 1 của Thế không vững).";
        else if (s1 > 0) {
            if (bads === 0) verdict = "✅ THUẬN LỢI, ổn, có thể đạt tích cực & hy vọng.";
            else if (goods > bads) verdict = "🟢 KHÁ THUẬN LỢI nhưng còn trở ngại (" + bads + " điểm bất lợi).";
            else if (goods === bads) verdict = "⚖ GIẰNG CO — có lợi có hại ngang nhau.";
            else verdict = "❌ TIÊU CỰC — Thế khá ổn nhưng điều kiện còn lại bất lợi.";
        } else {
            const net = goods - bads;
            if (net >= 2) verdict = "🟢 THUẬN LỢI NHẸ.";
            else if (net === 1) verdict = "🟢 HƠI THUẬN LỢI.";
            else if (net === 0) verdict = "⚖ TRUNG TÍNH — tiệm tiến.";
            else verdict = "❌ TIÊU CỰC — bất lợi.";
        }
        text += "\n[4] KẾT LUẬN\n" + verdict + "\n";
        text += "(Nền tảng 1: " + mark(s1) + " | Điều kiện phụ: " + goods + " thuận, " + bads + " bất lợi)\n";
        text += "=== HẾT LUẬN GIẢI ===";

        if (opts) {
            return {
                ok: true, text: text, que: q.name, queBien: qb ? qb.name : null, hao: h, dt: dtChon,
                T: T, U: U, D: D, B: B, Ys: Ys, yFromBien: yFromBien, E: E,
                nenTang: { s1: s1, s21: s21, s22: s22, s23: s23, s24: s24, s25: s25 },
                nguyHiem: nguyHiem, verdict: verdict, goods: goods, bads: bads,
                vuongSuy: { T: vuongSuy(T), U: vuongSuy(U), D: vuongSuy(D), B: B ? vuongSuy(B) : null },
                dataWarn: dataWarn
            };
        }

        const out = $("mcl_output");
        out.value = text;
        out.style.display = "block";
        out.style.height = "auto";
        out.style.height = Math.min(out.scrollHeight + 6, 1600) + "px";
        $("mcl_copyBtn").style.display = "block";
        $("mcl_fallbackBox").style.display = "none";
    }

    function autoRun() {
        if (resolveQueSilent() && $("mcl_hao").value) luanGiai(true);
    }
    function resolveQueSilent() {
        if (selectedQue && fold(selectedQue.name) === fold($("mcl_que").value)) return selectedQue;
        const m = matchQue($("mcl_que").value);
        return m.length === 1 ? m[0] : null;
    }

    function copyGeneric(text, btnId, fbBoxId, fbTaId, okLabel, normalLabel) {
        if (!text) return;
        function showSuccess() {
            const btn = $(btnId);
            $(fbBoxId).style.display = "none";
            btn.innerText = okLabel;
            setTimeout(() => { btn.innerText = normalLabel; }, 2000);
        }
        function showFallback() {
            $(fbBoxId).style.display = "block";
            const ta = $(fbTaId);
            ta.value = text; ta.focus(); ta.select();
        }
        function tryExec() {
            try {
                const ta = document.createElement("textarea");
                ta.value = text; ta.style.position = "fixed"; ta.style.left = "-9999px";
                document.body.appendChild(ta); ta.focus(); ta.select();
                const ok = document.execCommand("copy");
                document.body.removeChild(ta);
                return ok;
            } catch (e) { return false; }
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(showSuccess).catch(() => {
                if (tryExec()) showSuccess(); else showFallback();
            });
        } else if (tryExec()) showSuccess();
        else showFallback();
    }

    $("mcl_hao").addEventListener("change", autoRun);
    $("mcl_dt").addEventListener("change", autoRun);
    $("mcl_runBtn").addEventListener("click", function () { luanGiai(false); });
    $("mcl_copyBtn").addEventListener("click", function () {
        copyGeneric($("mcl_output").value, "mcl_copyBtn", "mcl_fallbackBox", "mcl_fallbackText",
            "✅ ĐÃ SAO CHÉP!", "📋 SAO CHÉP KẾT QUẢ");
    });
    ["mNhat", "mNguyet"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", function () {
            if ($("mcl_output").style.display === "block") autoRun();
        });
    });

    /* =====================================================================
     * MODE 2 — TÌM QUẺ: Collector / Evaluator / Box / Searcher
     * ===================================================================== */

    function readTuTriFromForm() {
        const thoi = (document.getElementById("mThoi") || {}).value || "";
        const nhat = (document.getElementById("mNhat") || {}).value || "";
        const nguyet = (document.getElementById("mNguyet") || {}).value || "";
        const tue = (document.getElementById("mThaiTue") || {}).value || "";
        const pN = parseCanChi(nhat), pG = parseCanChi(nguyet), pT = parseCanChi(thoi), pU = parseCanChi(tue);
        return {
            thoi: thoi, nhat: nhat, nguyet: nguyet, thaiTue: tue,
            thoiChi: pT.chi, nhatCan: pN.can, nhatChi: pN.chi,
            nguyetChi: pG.chi, thaiTueChi: pU.chi,
            nguon: "Form Nền"
        };
    }

    function parseDMY(str) {
        const m = String(str || "").trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
        if (!m) return null;
        const d = +m[1], mo = +m[2], y = +m[3];
        if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
        return { day: d, month: mo, year: y };
    }

    function buildTimePointsFromRange(fromStr, toStr, gioChi, stepDays) {
        const a = parseDMY(fromStr), b = parseDMY(toStr);
        if (!a || !b) return { ok: false, loi: "Ngày A/B không hợp lệ (dùng D/M/YYYY)." };
        if (typeof NL_getDayContext !== "function") {
            return { ok: false, loi: "Chưa có NL_getDayContext (calendar-core). Hãy chọn nguồn Form Nền hoặc nạp calendar-core." };
        }
        const start = new Date(a.year, a.month - 1, a.day);
        const end = new Date(b.year, b.month - 1, b.day);
        if (end < start) return { ok: false, loi: "Ngày B phải ≥ ngày A." };
        const maxDays = 120;
        const points = [];
        let cur = new Date(start.getTime());
        let guard = 0;
        while (cur <= end && guard < maxDays) {
            const y = cur.getFullYear(), m = cur.getMonth() + 1, d = cur.getDate();
            try {
                const ctx = NL_getDayContext(y, m, d, gioChi || null);
                const nhat = (ctx.socVong && ctx.socVong.canChiNgay) || "";
                const nguyet = (ctx.tietKhi && ctx.tietKhi.canChiThang) || (ctx.socVong && ctx.socVong.canChiThang) || "";
                const tue = (ctx.tietKhi && ctx.tietKhi.canChiNam) || (ctx.socVong && ctx.socVong.canChiNam) || "";
                const thoi = (ctx.gio && ctx.gio.canChi) || "";
                const pN = parseCanChi(nhat), pG = parseCanChi(nguyet), pT = parseCanChi(thoi), pU = parseCanChi(tue);
                if (pN.chi && pG.chi) {
                    points.push({
                        thoi: thoi, nhat: nhat, nguyet: nguyet, thaiTue: tue,
                        thoiChi: pT.chi, nhatCan: pN.can, nhatChi: pN.chi,
                        nguyetChi: pG.chi, thaiTueChi: pU.chi,
                        nguon: "calendar " + d + "/" + m + "/" + y + (gioChi ? " giờ " + gioChi : ""),
                        label: d + "/" + m + "/" + y
                    });
                }
            } catch (e) { /* skip bad day */ }
            cur.setDate(cur.getDate() + (stepDays || 1));
            guard++;
        }
        if (!points.length) return { ok: false, loi: "Không sinh được mốc Tứ Trị nào trong khoảng (kiểm tra năm 2023–2046 / calendar)." };
        return { ok: true, points: points };
    }

    function listDongConfigs(mode) {
        if (mode === "tinh_only") return [0];
        if (mode === "dong_only") return [1, 2, 3, 4, 5, 6];
        if (/^[1-6]$/.test(mode)) return [Number(mode)];
        return [0, 1, 2, 3, 4, 5, 6]; // all
    }

    function findDungOnQue(chu, dungLT) {
        const hits = [];
        for (let i = 0; i < 6; i++) {
            const p = parseLine(chu.n[i], i + 1);
            if (p.lt === dungLT) hits.push(p);
        }
        return hits;
    }

    function buildBien(chu, cung, haoDong) {
        if (!haoDong || typeof findQueByCode !== "function") return null;
        const arr = chu.c.split("");
        const bit = 6 - haoDong;
        arr[bit] = arr[bit] === "1" ? "0" : "1";
        const qb = findQueByCode(arr.join(""));
        if (!qb || !qb.data) return null;
        const i = haoDong - 1;
        const nb = qb.data.n[i].replace(/\(Thế\)|\(Ứng\)/g, "").trim().split(/\s+/);
        const chiB = nb[nb.length - 2];
        const hanhB = (typeof getHanh === "function" ? getHanh(nb[nb.length - 1]) : null) || CHI_HANH[chiB] || "";
        const ltB = (typeof tinhLucThan === "function") ? tinhLucThan(hanhB, cung.hanh) : nb.slice(0, -2).join(" ");
        return { queName: qb.name, line: { pos: haoDong, chi: chiB, hanh: hanhB, lt: ltB, isBien: true, the: false, ung: false } };
    }

    /** Đánh giá 1 ứng viên — sơ khảo ~70% */
    function evaluateCandidate(qEntry, haoDong, tuTri, dungLT, quanCase, threshold) {
        const chu = qEntry.data;
        const lines = chu.n.map((n, k) => parseLine(n, k + 1));
        const T = lines.find(l => l.the);
        const U = lines.find(l => l.ung);
        if (!T || !U) return null;

        const dungHits = findDungOnQue(chu, dungLT);
        if (!dungHits.length) return null; // filter sớm

        // Chính: trùng Thế ưu tiên
        let dungChinh = dungHits.find(h => h.the) || dungHits[0];
        const dungPhu = dungHits.filter(h => h !== dungChinh);

        const D = haoDong ? lines[haoDong - 1] : null;
        const bien = haoDong ? buildBien(chu, qEntry.cung, haoDong) : null;
        const B = bien ? bien.line : null;

        const vsThe = layCapVuongSuy(T.chi, tuTri.nguyetChi, "Nguyệt");
        const vsDung = layCapVuongSuy(dungChinh.chi, tuTri.nguyetChi, "Nguyệt");
        const vsUng = layCapVuongSuy(U.chi, tuTri.nguyetChi, "Nguyệt");
        const vsDong = D ? layCapVuongSuy(D.chi, tuTri.nguyetChi, "Nguyệt") : null;
        const vsBien = B ? layCapVuongSuy(B.chi, tuTri.nguyetChi, "Nguyệt") : null;

        // Hard gate Vượng/Suy
        const theOk = vsThe.diem >= 55;      // Hưu trở lên coi là chưa “yếu rõ”
        const dungOk = vsDung.diem >= 55;
        if (!theOk || !dungOk) {
            return {
                pass: false, score: 0,
                reason: !theOk ? "Thế dưới Medium (Vượng/Suy)" : "Dụng dưới Medium (Vượng/Suy)",
                breakdown: null
            };
        }

        // Tương tác sinh-khắc (rút gọn) — nhãn theo đúng cặp (Thế/Ứng, Động/Thế…)
        let tacDiem = 70;
        const notes = [];

        // shortPair: chuỗi hiển thị đúng cặp, vd "Thế/Ứng", "Động/Dụng"
        function applyRel(a, b, label, shortPair, weight) {
            const rd = relDir(a, b);
            if (rd.type === "none") return;
            if (rd.type === "hoa") {
                notes.push(label + ": tỷ hòa");
                tacDiem += 2 * weight;
                return;
            }
            const actorIsA = rd.from === "a";
            const type = rd.type;
            const verb = type === "sinh" ? "SINH" : "KHẮC";

            if (type === "khac") {
                const victim = actorIsA ? b : a;
                const actor = actorIsA ? a : b;
                if (victim === T || (victim.pos === T.pos && !victim.isBien)) {
                    tacDiem -= 18 * weight;
                    notes.push(label + ": có chiều KHẮC " + shortPair + " (hướng Thế) (−)");
                } else if (victim === dungChinh || (victim.pos === dungChinh.pos && victim.lt === dungChinh.lt)) {
                    tacDiem -= 14 * weight;
                    notes.push(label + ": có chiều KHẮC " + shortPair + " (hướng Dụng) (−)");
                } else if (victim === U || (victim.pos === U.pos && !victim.isBien)) {
                    tacDiem -= 6 * weight;
                    notes.push(label + ": có chiều KHẮC " + shortPair + " (hướng Ứng) (− nhẹ)");
                } else if (actor === T || actor === dungChinh) {
                    tacDiem += 4 * weight;
                    notes.push(label + ": có chiều KHẮC " + shortPair + " (+ nhẹ, Thế/Dụng khắc đối phương)");
                } else {
                    notes.push(label + ": có chiều KHẮC " + shortPair);
                }
            } else if (type === "sinh") {
                const receiver = actorIsA ? b : a;
                const giver = actorIsA ? a : b;
                if (receiver === T || receiver === dungChinh) {
                    tacDiem += 10 * weight;
                    notes.push(label + ": có chiều SINH " + shortPair + " (+)");
                } else if (receiver === U || (receiver.pos === U.pos && !receiver.isBien)) {
                    tacDiem += 3 * weight;
                    notes.push(label + ": có chiều SINH " + shortPair + " (hướng Ứng) (+ nhẹ)");
                } else if (giver === T || giver === dungChinh) {
                    tacDiem -= 6 * weight;
                    const giverName = (giver === T) ? "Thế" : "Dụng";
                    notes.push(label + ": " + giverName + " phải SINH ra ngoài qua " + shortPair + " (− nhẹ)");
                } else {
                    notes.push(label + ": có chiều SINH " + shortPair);
                }
            }
        }

        applyRel(T, dungChinh, "Thế↔Dụng", "Thế/Dụng", 1.2);
        applyRel(T, U, "Thế↔Ứng", "Thế/Ứng", 1.0);
        applyRel(U, dungChinh, "Ứng↔Dụng", "Ứng/Dụng", 0.9);
        if (D) {
            applyRel(D, T, "Động↔Thế", "Động/Thế", 1.1);
            applyRel(D, dungChinh, "Động↔Dụng", "Động/Dụng", 1.1);
            applyRel(D, U, "Động↔Ứng", "Động/Ứng", 0.7);
        }
        if (B) {
            applyRel(B, T, "Biến↔Thế", "Biến/Thế", 1.0);
            applyRel(B, dungChinh, "Biến↔Dụng", "Biến/Dụng", 1.0);
            if (D) applyRel(B, D, "Biến↔Động", "Biến/Động", 0.8);
        }

        // Lục Thần thú
        const thuMap = anLucThanThu(tuTri.nhatCan || "");
        const thuThe = thuMap[T.pos];
        const thuDung = thuMap[dungChinh.pos];
        const thuDong = D ? thuMap[D.pos] : null;
        let thuDiem = 70;
        const thuNotes = [];

        if (dungLT === "Quan Quỷ") {
            if (quanCase === "hung") {
                if (thuDung !== "Thanh Long") {
                    thuDiem -= 25;
                    thuNotes.push("Hung: Quan không lâm Thanh Long (−)");
                } else {
                    thuDiem += 8;
                    thuNotes.push("Hung: Quan lâm Thanh Long (+)");
                }
                if (D && D.lt === "Quan Quỷ") {
                    thuDiem -= 30;
                    thuNotes.push("Hung: Quan đang phát động (− nặng)");
                }
                if (thuDung === "Bạch Hổ") {
                    thuDiem -= 20;
                    thuNotes.push("Hung: Quan lâm Bạch Hổ (−)");
                }
            } else {
                // cát
                if (thuDung === "Bạch Hổ") {
                    thuDiem -= 28;
                    thuNotes.push("Cát: Quan lâm Bạch Hổ — không đạt rule (−)");
                }
                if (thuDung === "Thanh Long") {
                    thuDiem += 10;
                    thuNotes.push("Cát: Quan lâm Thanh Long (+)");
                }
            }
        } else {
            if (thuThe === "Bạch Hổ") { thuDiem -= 8; thuNotes.push("Thế lâm Bạch Hổ (−)"); }
            if (thuDong === "Bạch Hổ") { thuDiem -= 10; thuNotes.push("Hào động lâm Bạch Hổ (−)"); }
            if (D && D.lt === "Quan Quỷ") { thuDiem -= 12; thuNotes.push("Quan Quỷ phát động (−)"); }
        }

        // Tổng điểm sơ khảo (trọng số)
        // Thế VS 25%, Dụng VS 25%, Tương tác 30%, Thú 20%
        let score = Math.round(
            vsThe.diem * 0.25 +
            vsDung.diem * 0.25 +
            Math.max(0, Math.min(100, tacDiem)) * 0.30 +
            Math.max(0, Math.min(100, thuDiem)) * 0.20
        );
        // Ứng / Động / Biến: điều chỉnh nhẹ
        if (vsUng.diem < 40) score -= 3;
        if (vsDong && vsDong.diem >= 70) score += 2;
        if (vsBien && vsBien.diem >= 70) score += 2;
        if (vsBien && vsBien.diem < 40 && B) score -= 2;
        score = Math.max(0, Math.min(100, score));

        const pass = score >= threshold && theOk && dungOk
            && !(dungLT === "Quan Quỷ" && quanCase === "cat" && thuDung === "Bạch Hổ");

        return {
            pass: pass,
            score: score,
            reason: pass ? "Đạt sơ khảo" : "Dưới ngưỡng / rule thú",
            breakdown: {
                the: { chi: T.chi, lt: T.lt, pos: T.pos, vs: vsThe, thu: thuThe, medium: mediumFromDiem(vsThe.diem) },
                dung: { chi: dungChinh.chi, lt: dungChinh.lt, pos: dungChinh.pos, vs: vsDung, thu: thuDung, medium: mediumFromDiem(vsDung.diem), phu: dungPhu.map(p => p.pos) },
                ung: { chi: U.chi, lt: U.lt, pos: U.pos, vs: vsUng, medium: mediumFromDiem(vsUng.diem) },
                dong: D ? { chi: D.chi, lt: D.lt, pos: D.pos, vs: vsDong, thu: thuDong, medium: mediumFromDiem(vsDong.diem) } : null,
                bien: B ? { chi: B.chi, lt: B.lt, pos: B.pos, vs: vsBien, medium: mediumFromDiem(vsBien.diem), queBien: bien.queName } : null,
                tuongTacNotes: notes,
                thuNotes: thuNotes
            }
        };
    }

    function buildBoxCanNhac(qEntry, haoDong, tuTri) {
        const box = [];
        // Tuần Không
        let tk = [];
        if (window.LH_BRIDGE && typeof window.LH_BRIDGE.collect === "function") {
            try {
                const B = window.LH_BRIDGE.collect();
                if (B.tuanKhong && B.tuanKhong.chi) tk = B.tuanKhong.chi.slice();
            } catch (e) { /* ignore */ }
        }
        if (!tk.length && window.M02_DATA && window.M02_DATA.tuanKhongChi) {
            tk = window.M02_DATA.tuanKhongChi.slice();
        }
        if (!tk.length) {
            const el1 = document.getElementById("m01_tkChi1");
            const el2 = document.getElementById("m01_tkChi2");
            tk = [el1 && el1.value, el2 && el2.value].filter(Boolean);
        }
        if (tk.length) {
            const chu = qEntry.data;
            for (let i = 0; i < 6; i++) {
                const p = parseLine(chu.n[i], i + 1);
                if (tk.indexOf(p.chi) >= 0) {
                    box.push({ loai: "TuanKhong", hao: i + 1, tomTat: p.lt + " " + p.chi + " lâm Tuần Không [" + tk.join(",") + "]", nguon: "m01/bridge/m02" });
                }
            }
        } else {
            box.push({ loai: "TuanKhong", hao: null, tomTat: "Chưa có dữ liệu Tuần Không (chạy m01 hoặc nhập Form) — tự xem khi luận sâu.", nguon: "—" });
        }

        // Mộ
        if (window.M03_DATA && Array.isArray(window.M03_DATA.danhSachHaoMo) && window.M03_DATA.danhSachHaoMo.length) {
            window.M03_DATA.danhSachHaoMo.forEach(item => {
                box.push({ loai: "Mo", hao: item.hao, tomTat: "Hào " + item.hao + " đang bị kẹt Mộ " + (item.moTarget || "") + " — cân xuất mộ thủ công.", nguon: "m03" });
            });
        } else {
            box.push({ loai: "Mo", hao: null, tomTat: "Chưa có M03_DATA — tự đối chiếu Mộ khi luận sâu.", nguon: "—" });
        }

        // Xung / Phá
        if (window.LucHaoModules && window.LucHaoModules.m06 && window.LucHaoModules.m06.results) {
            const res = window.LucHaoModules.m06.results;
            [1, 2, 3, 4, 5, 6].forEach(h => {
                const r = res[h];
                if (!r || !r.ketLuan) return;
                if (/Phá|Ám Động|XUNG/i.test(r.ketLuan)) {
                    box.push({ loai: "Pha", hao: h, tomTat: "Hào " + h + ": " + r.ketLuan, nguon: "m06" });
                }
            });
        } else {
            box.push({ loai: "Pha", hao: null, tomTat: "Chưa có m06 results — tự đối chiếu Xung/Phá/Ám Động khi luận sâu.", nguon: "—" });
        }

        return box;
    }

    function shortQueName(full) {
        // "Hỏa Địa Tấn" → "Tấn"; "Thuần Càn" → "Thuần Càn"; "Đại Hữu" → "Đại Hữu"
        const s = String(full || "").trim();
        if (!s) return s;
        const parts = s.split(/\s+/);
        if (parts.length <= 2) return s;
        // 3+ từ: lấy 1–2 từ cuối (tên quẻ chuẩn)
        return parts.slice(-2).join(" ").replace(/^Địa |^Thiên |^Hỏa |^Thủy |^Sơn |^Lôi |^Phong |^Trạch /i, "") || parts[parts.length - 1];
    }

    function formatCandidate(c, idx) {
        let t = "";
        t += "──── #" + (idx + 1) + " | điểm sơ khảo: " + c.score + "/100 | " + (c.pass ? "ĐẠT" : "không đạt") + " ────\n";
        t += "Thời điểm: " + (c.time.label || c.time.nguon) + "\n";
        t += "  Tứ Trị: Thời " + (c.time.thoi || "—") + " | Nhật " + (c.time.nhat || "—") +
            " | Nguyệt " + (c.time.nguyet || "—") + " | Tuế " + (c.time.thaiTue || "—") + "\n";
        t += "Quẻ: " + c.queName + " (Họ " + c.cungName + ")\n";
        t += "Hào động: " + (c.haoDong ? ("Hào " + c.haoDong) : "QUẺ TĨNH") + "\n";
        if (c.breakdown) {
            const b = c.breakdown;
            t += "• Thế H" + b.the.pos + " " + b.the.lt + " " + b.the.chi +
                " | VS: " + (b.the.vs.chuoi || "?") + " → " + b.the.medium +
                (b.the.thu ? " | Thú: " + b.the.thu : "") + "\n";
            t += "• Dụng H" + b.dung.pos + " " + b.dung.lt + " " + b.dung.chi +
                " | VS: " + (b.dung.vs.chuoi || "?") + " → " + b.dung.medium +
                (b.dung.thu ? " | Thú: " + b.dung.thu : "") +
                (b.dung.phu && b.dung.phu.length ? " | phụ H" + b.dung.phu.join(",H") : "") + "\n";
            t += "• Ứng H" + b.ung.pos + " " + b.ung.lt + " " + b.ung.chi +
                " | VS: " + (b.ung.vs.chuoi || "?") + " → " + b.ung.medium + "\n";
            if (b.dong) {
                t += "• Động H" + b.dong.pos + " " + b.dong.lt + " " + b.dong.chi +
                    " | VS: " + (b.dong.vs.chuoi || "?") + " → " + b.dong.medium +
                    (b.dong.thu ? " | Thú: " + b.dong.thu : "") + "\n";
            }
            if (b.bien) {
                t += "• Biến " + b.bien.lt + " " + b.bien.chi +
                    " | VS: " + (b.bien.vs.chuoi || "?") + " → " + b.bien.medium +
                    (b.bien.queBien ? " | Quẻ Biến: " + b.bien.queBien : "") + "\n";
            }
            if (b.tuongTacNotes.length) t += "  Tương tác: " + b.tuongTacNotes.join("; ") + "\n";
            if (b.thuNotes.length) t += "  Lục Thần thú: " + b.thuNotes.join("; ") + "\n";
        }
        t += "【 Box Cân Nhắc — 30% user tự cân 】\n";
        (c.box || []).forEach(x => {
            t += "  - [" + x.loai + "]" + (x.hao ? " H" + x.hao : "") + ": " + x.tomTat + " (" + x.nguon + ")\n";
        });
        t += "\n";
        return t;
    }

    // ---- Trạng thái xem kết quả Tìm Quẻ ----
    let timResults = [];
    let timViewMode = "ten"; // "ten" | "list"
    let timTenPage = 0; // trang 0 = 1–40, 1 = 41–80…
    let timHeaderMeta = "";

    function setTimOutput(text) {
        const out = $("mcl_tim_output");
        out.value = text;
        out.style.display = "block";
        out.style.height = "auto";
        out.style.height = Math.min(out.scrollHeight + 6, 1800) + "px";
        $("mcl_tim_copyBtn").style.display = "block";
        $("mcl_tim_statsBtn").style.display = timResults.length ? "inline-block" : "none";
        $("mcl_tim_fallbackBox").style.display = "none";
    }

    /** Ngày DL hiển thị: ưu tiên label calendar (D/M/YYYY), không thì suy từ nguon */
    function formatNgayDL(time) {
        if (!time) return "—";
        if (time.label) return time.label;
        const m = String(time.nguon || "").match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (m) return m[1];
        if (time.nhat || time.nguyet || time.thaiTue) {
            return [time.thoi || "", time.nhat || "", time.nguyet || "", time.thaiTue || ""]
                .filter(Boolean).join(" | ");
        }
        return time.nguon || "—";
    }

    /**
     * Thống kê .txt — nhóm theo tên quẻ, tối đa 100 dòng kết quả.
     * Format:
     *   Phong Địa Quan :
     *   12.11.2026 ** hào động : 2 ** điểm sơ khảo : 86/100
     */
    function buildStatsTxt(results, metaHeader) {
        const MAX = 100;
        const list = (results || []).slice(0, MAX);
        const groups = {};
        const order = [];
        list.forEach(r => {
            if (!groups[r.queName]) {
                groups[r.queName] = [];
                order.push(r.queName);
            }
            groups[r.queName].push(r);
        });

        let t = "";
        t += "THỐNG KÊ QUẺ ĐẠT YÊU CẦU (Tìm Quẻ — sơ khảo)\n";
        t += "Tối đa 100 kết quả | Xuất: " + new Date().toLocaleString("vi-VN") + "\n";
        if (metaHeader) t += metaHeader.replace(/^===\s*/gm, "").trim() + "\n";
        t += "Tổng dòng trong file: " + list.length +
            (results.length > MAX ? " (còn " + (results.length - MAX) + " không ghi — giới hạn 100)\n" : "\n");
        t += "========================================\n\n";
        t += "Các quẻ đạt yêu cầu :\n\n";

        order.forEach(name => {
            t += name + " :\n";
            groups[name].forEach(r => {
                const ngay = formatNgayDL(r.time).replace(/\//g, ".");
                const hao = r.haoDong ? String(r.haoDong) : "tĩnh";
                t += ngay + " ** hào động : " + hao + " ** điểm sơ khảo : " + r.score + "/100\n";
            });
            t += "\n";
        });

        t += "========================================\n";
        t += "Hết thống kê.\n";
        return t;
    }

    function downloadStatsTxt() {
        if (!timResults.length) {
            alert("Chưa có kết quả Tìm Quẻ để thống kê. Hãy chạy Tìm Quẻ trước.");
            return;
        }
        const text = buildStatsTxt(timResults, timHeaderMeta);
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const stamp = new Date();
        const fname = "thong-ke-tim-que_" +
            stamp.getFullYear() +
            ("0" + (stamp.getMonth() + 1)).slice(-2) +
            ("0" + stamp.getDate()).slice(-2) + "_" +
            ("0" + stamp.getHours()).slice(-2) +
            ("0" + stamp.getMinutes()).slice(-2) + ".txt";
        a.href = url;
        a.download = fname;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);

        const btn = $("mcl_tim_statsBtn");
        const old = btn.innerText;
        btn.innerText = "✅ ĐÃ TẢI .txt";
        setTimeout(function () { btn.innerText = old; }, 2000);
    }

    function uniqueQueNames(results) {
        const seen = {};
        const arr = [];
        results.forEach(r => {
            if (!seen[r.queName]) {
                seen[r.queName] = true;
                arr.push({ full: r.queName, short: shortQueName(r.queName), cung: r.cungName });
            }
        });
        arr.sort((a, b) => a.short.localeCompare(b.short, "vi"));
        return arr;
    }

    function refreshTenSelect() {
        const sel = $("mcl_tim_tenSelect");
        const names = uniqueQueNames(timResults);
        sel.innerHTML = '<option value="">-- Tất cả quẻ đạt (rút gọn) --</option>';
        names.forEach(n => {
            const opt = document.createElement("option");
            opt.value = n.full;
            opt.textContent = n.short + "  —  " + n.full + " (Họ " + n.cung + ")";
            sel.appendChild(opt);
        });
    }

    function refreshListSelect() {
        const sel = $("mcl_tim_listSelect");
        const n = timResults.length;
        const pages = Math.max(1, Math.ceil(n / 10));
        sel.innerHTML = "";
        for (let i = 0; i < pages && i < 10; i++) {
            const from = i * 10 + 1;
            const to = Math.min((i + 1) * 10, n);
            const opt = document.createElement("option");
            opt.value = String(i);
            opt.textContent = "List " + (i + 1) + " (quẻ " + from + "–" + to + ")";
            sel.appendChild(opt);
        }
        if (pages > 10) {
            // List 10 covers 91–100; nếu nhiều hơn vẫn gói phần còn lại vào list cuối
            const opt = sel.options[sel.options.length - 1];
            if (opt) opt.textContent = "List 10 (quẻ 91–" + n + ")";
        }
    }

    function setViewMode(mode) {
        timViewMode = mode;
        const tenOn = mode === "ten";
        $("mcl_tim_modeTen").style.opacity = tenOn ? "1" : "0.55";
        $("mcl_tim_modeList").style.opacity = tenOn ? "0.55" : "1";
        $("mcl_tim_modeTen").textContent = tenOn ? "📜 Menu Tên Quẻ (BẬT)" : "📜 Menu Tên Quẻ (TẮT)";
        $("mcl_tim_modeList").textContent = tenOn ? "📑 Menu Xem List (TẮT)" : "📑 Menu Xem List (BẬT)";
        $("mcl_tim_tenBox").style.display = tenOn ? "block" : "none";
        $("mcl_tim_listBox").style.display = tenOn ? "none" : "block";
        if (tenOn) renderTenView();
        else renderListView();
    }

    function renderTenView() {
        const chosen = $("mcl_tim_tenSelect").value;
        let subset = timResults;
        if (chosen) subset = timResults.filter(r => r.queName === chosen);

        const PAGE = 40;
        const start = timTenPage * PAGE;
        const pageItems = subset.slice(start, start + PAGE);
        const hasMore = subset.length > start + PAGE;

        $("mcl_tim_tenNext40").style.display = (subset.length > PAGE) ? "inline-block" : "none";
        $("mcl_tim_tenNext40").textContent = hasMore
            ? ("Xem Tiếp (" + (start + PAGE + 1) + "–" + Math.min(start + PAGE * 2, subset.length) + ")")
            : (timTenPage > 0 ? "← Về đầu (1–" + Math.min(PAGE, subset.length) + ")" : "Xem Tiếp");

        let text = timHeaderMeta;
        text += "【 Chế độ: Menu Tên Quẻ 】\n";
        if (chosen) text += "Đang xem: " + chosen + " — " + subset.length + " cấu hình đạt\n\n";
        else text += "Tất cả: " + subset.length + " ứng viên | trang " + (timTenPage + 1) +
            " (hiện " + pageItems.length + " dòng, tối đa 40/trang)\n\n";

        if (!pageItems.length) text += "(Không có ứng viên trong lựa chọn này.)\n";
        else pageItems.forEach((c, i) => { text += formatCandidate(c, start + i); });
        text += "=== HẾT ===";
        setTimOutput(text);
    }

    function renderListView() {
        const li = parseInt($("mcl_tim_listSelect").value, 10) || 0;
        const start = li * 10;
        const pageItems = timResults.slice(start, start + 10);
        let text = timHeaderMeta;
        text += "【 Chế độ: Xem List " + (li + 1) + " — quẻ " + (start + 1) + "–" + (start + pageItems.length) + " 】\n";
        text += "Tổng đạt: " + timResults.length + "\n\n";
        if (!pageItems.length) text += "(List trống.)\n";
        else pageItems.forEach((c, i) => { text += formatCandidate(c, start + i); });
        text += "=== HẾT ===";
        setTimOutput(text);
    }

    function runTimQue() {
        const dungLT = $("mcl_tim_dt").value;
        if (!dungLT) { alert("Vui lòng chọn Dụng Thần."); return; }
        const quanCase = dungLT === "Quan Quỷ" ? ($("mcl_tim_quanCase").value || "cat") : null;
        const threshold = parseInt($("mcl_tim_threshold").value, 10) || SCORE_PASS;
        const haoMode = $("mcl_tim_haoMode").value;
        const dongList = listDongConfigs(haoMode);
        const requireClean = $("mcl_tim_requireCleanBox").checked;
        const status = $("mcl_tim_status");
        const out = $("mcl_tim_output");

        let timePoints = [];
        const nguon = $("mcl_tim_nguonTime").value;
        if (nguon === "form") {
            const tt = readTuTriFromForm();
            if (!tt.nhatChi || !tt.nguyetChi) {
                alert("Form Nền thiếu Nhật hoặc Nguyệt. Nhập Tứ Trị phía trên trước.");
                return;
            }
            timePoints = [tt];
        } else {
            const built = buildTimePointsFromRange(
                $("mcl_tim_from").value,
                $("mcl_tim_to").value,
                $("mcl_tim_gio").value || null,
                parseInt($("mcl_tim_step").value, 10) || 1
            );
            if (!built.ok) { alert(built.loi); return; }
            timePoints = built.points;
        }

        status.textContent = "Đang quét " + timePoints.length + " mốc × 64 quẻ × " + dongList.length + " cấu hình hào…";
        out.value = "";
        out.style.display = "block";
        $("mcl_tim_viewBar").style.display = "none";

        setTimeout(function () {
            const results = [];
            let scanned = 0;
            timePoints.forEach(tp => {
                ALL_QUE.forEach(q => {
                    dongList.forEach(hd => {
                        scanned++;
                        const ev = evaluateCandidate(q, hd, tp, dungLT, quanCase, threshold);
                        if (!ev || !ev.pass) return;
                        const boxNhac = buildBoxCanNhac(q, hd, tp);
                        const hasHeavy = boxNhac.some(x =>
                            (x.loai === "TuanKhong" && x.hao) ||
                            (x.loai === "Mo" && x.hao) ||
                            (x.loai === "Pha" && x.hao)
                        );
                        if (requireClean && hasHeavy) return;
                        results.push({
                            pass: true,
                            score: ev.score,
                            time: tp,
                            queName: q.name,
                            cungName: q.cung.name,
                            haoDong: hd || 0,
                            breakdown: ev.breakdown,
                            box: boxNhac,
                            hasHeavy: hasHeavy
                        });
                    });
                });
            });

            results.sort((a, b) => b.score - a.score || (a.hasHeavy ? 1 : 0) - (b.hasHeavy ? 1 : 0));
            timResults = results;
            window.MCL_TIM_QUE_RESULTS = results;
            timTenPage = 0;

            timHeaderMeta = "=== TÌM QUẺ — SƠ KHẢO (tối đa 1 hào động) ===\n" +
                "Dụng Thần: " + dungLT + (quanCase ? " | Case Quan: " + quanCase : "") + "\n" +
                "Ngưỡng: " + threshold + " | Đã quét: " + scanned + " | Đạt: " + results.length + "\n" +
                "Ghi chú: điểm sơ khảo ~70%. Box Cân Nhắc (Không/Phá/Mộ) — user tự quyết cuối.\n\n";

            if (!results.length) {
                setTimOutput(timHeaderMeta +
                    "Không có ứng viên đạt ngưỡng.\nGợi ý: hạ ngưỡng, nới khoảng ngày, bỏ tick Box sạch, hoặc đổi case Quan.\n=== HẾT ===");
                status.textContent = "Xong — 0 ứng viên đạt.";
                $("mcl_tim_viewBar").style.display = "none";
                return;
            }

            refreshTenSelect();
            refreshListSelect();
            $("mcl_tim_viewBar").style.display = "block";
            setViewMode("ten");
            status.textContent = "Xong — đạt " + results.length + " / " + scanned +
                ". Dùng Menu Tên Quẻ hoặc Xem List để duyệt.";
        }, 30);
    }

    $("mcl_tim_runBtn").addEventListener("click", runTimQue);
    $("mcl_tim_copyBtn").addEventListener("click", function () {
        copyGeneric($("mcl_tim_output").value, "mcl_tim_copyBtn", "mcl_tim_fallbackBox", "mcl_tim_fallbackText",
            "✅ ĐÃ SAO CHÉP!", "📋 SAO CHÉP KẾT QUẢ TÌM QUẺ");
    });
    $("mcl_tim_statsBtn").addEventListener("click", downloadStatsTxt);

    $("mcl_tim_modeTen").addEventListener("click", function () { setViewMode("ten"); });
    $("mcl_tim_modeList").addEventListener("click", function () { setViewMode("list"); });
    $("mcl_tim_tenShow").addEventListener("click", function () { timTenPage = 0; renderTenView(); });
    $("mcl_tim_tenSelect").addEventListener("change", function () { timTenPage = 0; renderTenView(); });
    $("mcl_tim_tenNext40").addEventListener("click", function () {
        const chosen = $("mcl_tim_tenSelect").value;
        const subset = chosen ? timResults.filter(r => r.queName === chosen) : timResults;
        const PAGE = 40;
        if ((timTenPage + 1) * PAGE < subset.length) timTenPage++;
        else timTenPage = 0;
        renderTenView();
    });
    $("mcl_tim_listShow").addEventListener("click", function () { renderListView(); });
    $("mcl_tim_listSelect").addEventListener("change", function () { renderListView(); });

    /* ===================== EXPOSE ===================== */
    window.MCL_CORE = {
        version: 2,
        phanTich: function (opts) { return luanGiai(true, opts || {}); },
        parseLine: parseLine,
        relDir: relDir,
        meaning: meaning,
        evaluateCandidate: evaluateCandidate,
        ROLE_NAME: ROLE_NAME,
        CHI_HANH: CHI_HANH
    };

})();
