/* =========================================================================
 * tracuu.js — MODULE TRA CỨU QUẺ (hiển thị, tương tác)
 * -------------------------------------------------------------------------
 * Load SAU mchienluoc.js (và m01–m08, calendar-core, total.html core).
 *
 * Chức năng:
 *  - Gõ tên 1/64 quẻ (autofill) + chọn tối đa 4 hào động
 *  - Nhập Tứ Trị theo Dương lịch → Can Chi (calendar-core NL_getDayContext)
 *    hoặc dán Tứ Trị thủ công / lấy từ Form Nền
 *  - Dụng Thần: Phụ Mẫu… Quan Quỷ + thêm "Thế" (cầu an ổn bản thân)
 *  - Phục Thần thủ công nếu Dụng không lộ trên quẻ
 *  - Gọi MCL_CORE (Luận 1 quẻ / evaluator Tìm Quẻ) + dữ liệu m01–m08 khi có
 *  - Điểm sơ khảo tổng hợp + Box Cân Nhắc
 *  - Nút Thu Gọn / Mở rộng
 * ========================================================================= */
(function () {
    "use strict";

    if (typeof dataDich === "undefined" || typeof moduleSlot !== "function") {
        console.error("tracuu.js: thiếu dataDich / moduleSlot — module không chạy.");
        return;
    }

    const CHI_HANH = {
        "Tý": "Thủy", "Hợi": "Thủy", "Dần": "Mộc", "Mão": "Mộc",
        "Tỵ": "Hỏa", "Ngọ": "Hỏa", "Thân": "Kim", "Dậu": "Kim",
        "Sửu": "Thổ", "Thìn": "Thổ", "Mùi": "Thổ", "Tuất": "Thổ"
    };
    const CHI_LIST = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
    const CAN_LIST = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
    const DUNG_OPTS = ["Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ", "Thế"];
    const SINH = { "Kim": "Thủy", "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim" };
    const KHAC = { "Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim" };
    const CYCLE_LUC_THAN = ["Thanh Long", "Chu Tước", "Câu Trần", "Đằng Xà", "Bạch Hổ", "Huyền Vũ"];

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

    function parseCanChi(str) {
        const t = String(str || "").normalize("NFC").trim().split(/\s+/).filter(Boolean);
        if (t.length >= 2) {
            let chi = t[1]; if (chi === "Tị") chi = "Tỵ";
            return { can: t[0], chi: chi };
        }
        if (t.length === 1) {
            let chi = t[0]; if (chi === "Tị") chi = "Tỵ";
            if (CHI_LIST.indexOf(chi) >= 0) return { can: "", chi: chi };
            if (CAN_LIST.indexOf(chi) >= 0) return { can: chi, chi: "" };
        }
        return { can: "", chi: "" };
    }

    function parseLine(n, pos) {
        const clean = n.replace(/\(Thế\)|\(Ứng\)/g, "").trim();
        const w = clean.split(/\s+/);
        const chi = w[w.length - 2];
        const hanh = (typeof getHanh === "function" ? getHanh(w[w.length - 1]) : null) || CHI_HANH[chi] || "";
        return {
            pos: pos, lt: w.slice(0, -2).join(" "), chi: chi, hanh: hanh,
            the: /\(Thế\)/.test(n), ung: /\(Ứng\)/.test(n), isBien: false, isPhuc: false
        };
    }

    function startDeityIndex(canStr) {
        const i = CAN_LIST.indexOf(canStr);
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

    function layCapVuongSuy(chi, chiTru, tenTru) {
        if (!chi || !chiTru) return { chuoi: null, cap: null, diem: 50 };
        if (typeof VUONG_SUY_TABLE === "undefined" || !VUONG_SUY_TABLE[chi] || !VUONG_SUY_TABLE[chi][chiTru]) {
            return { chuoi: null, cap: null, diem: 50 };
        }
        const raw = VUONG_SUY_TABLE[chi][chiTru];
        const chuoi = (typeof resolveVuongSuy === "function") ? resolveVuongSuy(raw, tenTru) : String(raw);
        let diem = 55;
        if (chuoi.indexOf("Vượng") >= 0) diem = 90;
        else if (chuoi.indexOf("Tướng") >= 0) diem = 78;
        else if (chuoi.indexOf("Hưu") >= 0) diem = 55;
        else if (chuoi.indexOf("Tù") >= 0) diem = 35;
        else if (chuoi.indexOf("Tử") >= 0) diem = 20;
        return { chuoi: chuoi, cap: null, diem: diem };
    }

    function mediumLabel(diem) {
        if (diem >= 70) return "Medium+";
        if (diem >= 55) return "Cận Medium";
        return "Dưới Medium";
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

    function parseDMY(str) {
        const m = String(str || "").trim().match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
        if (!m) return null;
        return { day: +m[1], month: +m[2], year: +m[3] };
    }

    /* ===================== UI ===================== */
    const boxHtml = `
        <div class="header" style="border-bottom:1px solid var(--gold);padding:5px 0 10px 0;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
            <h1 style="font-size:1.1rem;margin:0;">Module Tra Cứu Quẻ</h1>
            <button type="button" class="btn-secondary" id="tc_toggle" style="margin:0;padding:6px 12px;">📦 Thu Gọn</button>
        </div>
        <div id="tc_body">
            <p style="font-size:0.72rem;color:#888;margin:0 0 12px;line-height:1.45;">
                Tra cứu <b>1 quẻ</b> trong 64 quẻ, chọn tối đa <b>4 hào động</b>, nhập Tứ Trị (Dương lịch hoặc Can Chi).
                Dùng logic <code>mchienluoc</code> (Luận / sơ khảo) + core + m01–m08 khi có.
                Dụng Thần có thêm lựa chọn <b>Thế</b> (cầu an ổn bản thân).
            </p>

            <div class="input-suggest-box">
                <label>Tên Quẻ</label>
                <input type="text" id="tc_que" placeholder="vd: Hỏa Địa Tấn / hoa dia tan..." autocomplete="off">
                <div id="tc_sug" class="suggestions-list"></div>
            </div>
            <div id="tc_hoInfo" style="font-size:0.75rem;color:#888;margin:-4px 0 12px;">Họ Quẻ: —</div>

            <label>Hào động (tối đa 4 — tick chọn)</label>
            <div id="tc_haoBox" style="display:flex;flex-wrap:wrap;gap:10px 16px;margin:6px 0 12px;font-size:0.85rem;">
                ${[1, 2, 3, 4, 5, 6].map(h =>
                    `<label style="cursor:pointer;user-select:none;"><input type="checkbox" class="tc_hao" value="${h}"> Hào ${h}</label>`
                ).join("")}
            </div>
            <div id="tc_haoWarn" style="font-size:0.72rem;color:#e74c3c;display:none;margin:-6px 0 10px;">Chỉ được chọn tối đa 4 hào động.</div>

            <label>Dụng Thần</label>
            <select id="tc_dt">
                <option value="">-- Chưa chọn --</option>
                ${DUNG_OPTS.map(d => `<option value="${d}">${d}${d === "Thế" ? " (an ổn bản thân)" : ""}</option>`).join("")}
            </select>
            <div id="tc_quanBox" style="display:none;margin:8px 0;padding:8px;border:1px solid #444;border-radius:8px;">
                <label style="margin:0;">Case Quan Quỷ</label>
                <select id="tc_quanCase">
                    <option value="cat">Cát thần</option>
                    <option value="hung">Hung thần</option>
                </select>
            </div>

            <div id="tc_phucBox" style="margin:10px 0;padding:10px;border:1px dashed #666;border-radius:8px;display:none;">
                <div style="font-size:0.8rem;color:var(--gold);margin-bottom:6px;">Dụng Thần không lộ trên quẻ — nhập Phục Thần (thủ công)</div>
                <div class="m-grid">
                    <div>
                        <label>Lục Thân Phục</label>
                        <select id="tc_phucLT">
                            <option value="">-- --</option>
                            ${["Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ"].map(d =>
                                `<option value="${d}">${d}</option>`).join("")}
                        </select>
                    </div>
                    <div>
                        <label>Địa Chi Phục</label>
                        <select id="tc_phucChi">
                            <option value="">-- --</option>
                            ${CHI_LIST.map(c => `<option value="${c}">${c}</option>`).join("")}
                        </select>
                    </div>
                </div>
                <label style="margin-top:6px;">Vị trí hào Phục (1–6, tuỳ chọn)</label>
                <select id="tc_phucPos">
                    <option value="">-- Không chỉ định --</option>
                    ${[1, 2, 3, 4, 5, 6].map(h => `<option value="${h}">Hào ${h}</option>`).join("")}
                </select>
            </div>

            <label style="margin-top:10px;">Nguồn Tứ Trị</label>
            <select id="tc_timeSrc">
                <option value="form">Lấy từ Form Nền (Lập Thời phía trên)</option>
                <option value="dl">Dương lịch (ngày + giờ Chi) → calendar-core</option>
                <option value="manual">Nhập Can Chi thủ công</option>
            </select>

            <div id="tc_timeDL" style="display:none;margin-top:8px;">
                <div class="m-grid">
                    <div>
                        <label>Ngày DL (D/M/YYYY)</label>
                        <input type="text" id="tc_ngayDL" placeholder="vd: 5/4/2019">
                    </div>
                    <div>
                        <label>Giờ Chi</label>
                        <select id="tc_gioChi">
                            <option value="">-- --</option>
                            ${CHI_LIST.map(c => `<option value="${c}">${c}</option>`).join("")}
                        </select>
                    </div>
                </div>
            </div>
            <div id="tc_timeManual" style="display:none;margin-top:8px;">
                <div class="m-grid">
                    <div><label>Thời (Can Chi)</label><input type="text" id="tc_mThoi" placeholder="Ất Tỵ"></div>
                    <div><label>Nhật</label><input type="text" id="tc_mNhat" placeholder="Nhâm Thân"></div>
                </div>
                <div class="m-grid">
                    <div><label>Nguyệt</label><input type="text" id="tc_mNguyet" placeholder="Mậu Thìn"></div>
                    <div><label>Tuế</label><input type="text" id="tc_mTue" placeholder="Kỷ Hợi"></div>
                </div>
            </div>
            <div id="tc_timePreview" style="font-size:0.75rem;color:#aaa;margin:8px 0 4px;">Tứ Trị: —</div>

            <button class="m-btn-process" id="tc_runBtn">🔎 TRA CỨU &amp; SƠ KHẢO</button>
            <textarea id="tc_output" class="m-output-box" readonly></textarea>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
                <button class="btn-copy" id="tc_copyBtn" style="display:none;margin:0;">📋 SAO CHÉP</button>
            </div>
            <div class="fallback-box" id="tc_fallbackBox">
                <textarea id="tc_fallbackText" readonly></textarea>
                <div class="fallback-hint">Chọn hết ô trên rồi Ctrl+C nếu trình duyệt chặn copy</div>
            </div>
        </div>
    `;

    const box = moduleSlot(boxHtml);
    const $ = (id) => box.querySelector("#" + id);

    $("tc_output").addEventListener("click", function () { this.select(); });
    $("tc_fallbackText").addEventListener("click", function () { this.select(); });

    /* ----- Thu gọn ----- */
    let collapsed = false;
    $("tc_toggle").addEventListener("click", function () {
        collapsed = !collapsed;
        $("tc_body").style.display = collapsed ? "none" : "block";
        this.textContent = collapsed ? "📖 Mở rộng" : "📦 Thu Gọn";
    });

    /* ----- Hào động max 4 ----- */
    function getSelectedHaos() {
        return Array.prototype.slice.call(box.querySelectorAll(".tc_hao:checked")).map(el => +el.value).sort((a, b) => a - b);
    }
    box.querySelectorAll(".tc_hao").forEach(cb => {
        cb.addEventListener("change", function () {
            const sel = getSelectedHaos();
            if (sel.length > 4) {
                this.checked = false;
                $("tc_haoWarn").style.display = "block";
                setTimeout(() => { $("tc_haoWarn").style.display = "none"; }, 2200);
            }
        });
    });

    /* ----- Autofill quẻ ----- */
    let selectedQue = null;
    function matchQue(text) {
        const f = fold(text);
        if (!f) return [];
        const exact = ALL_QUE.filter(q => q.fold === f);
        if (exact.length) return exact;
        const toks = f.split(" ");
        return ALL_QUE.filter(q => toks.every(t => q.fold.indexOf(t) !== -1));
    }
    function hideSug() { $("tc_sug").style.display = "none"; }
    function setQue(q) {
        selectedQue = q;
        if (q) {
            $("tc_que").value = q.name;
            $("tc_hoInfo").innerHTML = "Họ Quẻ: <b style=\"color:var(--gold)\">Họ " + q.cung.name + " (" + q.cung.hanh + ")</b>";
            refreshPhucVisibility();
        } else {
            $("tc_hoInfo").textContent = "Họ Quẻ: —";
        }
    }
    function resolveQue() {
        if (selectedQue && fold(selectedQue.name) === fold($("tc_que").value)) return selectedQue;
        const m = matchQue($("tc_que").value);
        if (m.length === 1) { setQue(m[0]); return m[0]; }
        setQue(null);
        return null;
    }
    $("tc_que").addEventListener("input", function () {
        const m = matchQue(this.value);
        const sug = $("tc_sug");
        sug.innerHTML = "";
        if (!this.value.trim() || !m.length) { hideSug(); setQue(null); return; }
        m.slice(0, 12).forEach(q => {
            const div = document.createElement("div");
            div.className = "suggestion-item";
            div.textContent = q.name + "  —  Họ " + q.cung.name;
            div.addEventListener("mousedown", function (ev) {
                ev.preventDefault();
                setQue(q);
                hideSug();
            });
            sug.appendChild(div);
        });
        sug.style.display = "block";
        if (m.length === 1 && m[0].fold === fold(this.value)) { setQue(m[0]); hideSug(); }
        else if (!(selectedQue && fold(selectedQue.name) === fold(this.value))) setQue(null);
    });
    $("tc_que").addEventListener("keydown", function (ev) {
        if (ev.key === "Enter") {
            const m = matchQue(this.value);
            if (m.length) setQue(m[0]);
            hideSug();
            ev.preventDefault();
        }
    });
    document.addEventListener("click", function (ev) { if (!box.contains(ev.target)) hideSug(); });

    /* ----- Dụng / Phục visibility ----- */
    $("tc_dt").addEventListener("change", function () {
        $("tc_quanBox").style.display = this.value === "Quan Quỷ" ? "block" : "none";
        refreshPhucVisibility();
    });

    function dungOnQue(q, dungLT) {
        if (!q || !dungLT) return [];
        if (dungLT === "Thế") {
            const lines = q.data.n.map((n, i) => parseLine(n, i + 1));
            const T = lines.find(l => l.the);
            return T ? [T] : [];
        }
        const hits = [];
        q.data.n.forEach((n, i) => {
            const p = parseLine(n, i + 1);
            if (p.lt === dungLT) hits.push(p);
        });
        return hits;
    }

    function refreshPhucVisibility() {
        const q = resolveQue();
        const dt = $("tc_dt").value;
        if (!q || !dt || dt === "Thế") {
            $("tc_phucBox").style.display = "none";
            return;
        }
        const hits = dungOnQue(q, dt);
        $("tc_phucBox").style.display = hits.length ? "none" : "block";
        if (!hits.length) $("tc_phucLT").value = dt;
    }

    /* ----- Time source ----- */
    $("tc_timeSrc").addEventListener("change", function () {
        $("tc_timeDL").style.display = this.value === "dl" ? "block" : "none";
        $("tc_timeManual").style.display = this.value === "manual" ? "block" : "none";
        updateTimePreview();
    });
    ["tc_ngayDL", "tc_gioChi", "tc_mThoi", "tc_mNhat", "tc_mNguyet", "tc_mTue"].forEach(id => {
        const el = $(id);
        if (el) el.addEventListener("change", updateTimePreview);
        if (el) el.addEventListener("input", updateTimePreview);
    });

    function readTuTri() {
        const src = $("tc_timeSrc").value;
        if (src === "form") {
            const thoi = (document.getElementById("mThoi") || {}).value || "";
            const nhat = (document.getElementById("mNhat") || {}).value || "";
            const nguyet = (document.getElementById("mNguyet") || {}).value || "";
            const tue = (document.getElementById("mThaiTue") || {}).value || "";
            const pN = parseCanChi(nhat), pG = parseCanChi(nguyet), pT = parseCanChi(thoi), pU = parseCanChi(tue);
            return {
                ok: !!(pN.chi && pG.chi),
                thoi, nhat, nguyet, thaiTue: tue,
                thoiChi: pT.chi, nhatCan: pN.can, nhatChi: pN.chi,
                nguyetChi: pG.chi, thaiTueChi: pU.chi,
                label: "Form Nền"
            };
        }
        if (src === "manual") {
            const thoi = $("tc_mThoi").value.trim();
            const nhat = $("tc_mNhat").value.trim();
            const nguyet = $("tc_mNguyet").value.trim();
            const tue = $("tc_mTue").value.trim();
            const pN = parseCanChi(nhat), pG = parseCanChi(nguyet), pT = parseCanChi(thoi), pU = parseCanChi(tue);
            return {
                ok: !!(pN.chi && pG.chi),
                thoi, nhat, nguyet, thaiTue: tue,
                thoiChi: pT.chi, nhatCan: pN.can, nhatChi: pN.chi,
                nguyetChi: pG.chi, thaiTueChi: pU.chi,
                label: "Nhập tay"
            };
        }
        // dl
        const dmy = parseDMY($("tc_ngayDL").value);
        const gio = $("tc_gioChi").value || null;
        if (!dmy) return { ok: false, loi: "Ngày DL không hợp lệ (D/M/YYYY)." };
        if (typeof NL_getDayContext !== "function") {
            return { ok: false, loi: "Chưa có calendar-core (NL_getDayContext)." };
        }
        try {
            const ctx = NL_getDayContext(dmy.year, dmy.month, dmy.day, gio);
            const nhat = (ctx.socVong && ctx.socVong.canChiNgay) || "";
            const nguyet = (ctx.tietKhi && ctx.tietKhi.canChiThang) || (ctx.socVong && ctx.socVong.canChiThang) || "";
            const tue = (ctx.tietKhi && ctx.tietKhi.canChiNam) || (ctx.socVong && ctx.socVong.canChiNam) || "";
            const thoi = (ctx.gio && ctx.gio.canChi) || "";
            const pN = parseCanChi(nhat), pG = parseCanChi(nguyet), pT = parseCanChi(thoi), pU = parseCanChi(tue);
            return {
                ok: !!(pN.chi && pG.chi),
                thoi, nhat, nguyet, thaiTue: tue,
                thoiChi: pT.chi, nhatCan: pN.can, nhatChi: pN.chi,
                nguyetChi: pG.chi, thaiTueChi: pU.chi,
                label: dmy.day + "/" + dmy.month + "/" + dmy.year + (gio ? " giờ " + gio : "")
            };
        } catch (e) {
            return { ok: false, loi: "calendar-core lỗi: " + (e && e.message ? e.message : e) };
        }
    }

    function updateTimePreview() {
        const tt = readTuTri();
        if (!tt.ok) {
            $("tc_timePreview").textContent = "Tứ Trị: — " + (tt.loi || "(chưa đủ Nhật/Nguyệt)");
            return;
        }
        $("tc_timePreview").textContent = "Tứ Trị: Thời " + (tt.thoi || "—") +
            " | Nhật " + (tt.nhat || "—") + " | Nguyệt " + (tt.nguyet || "—") +
            " | Tuế " + (tt.thaiTue || "—") + "  [" + tt.label + "]";
    }

    /* ----- Build biến với nhiều hào động ----- */
    function buildBienMulti(chu, cung, haos) {
        if (!haos.length || typeof findQueByCode !== "function") return null;
        const arr = chu.c.split("");
        haos.forEach(h => {
            const bit = 6 - h;
            arr[bit] = arr[bit] === "1" ? "0" : "1";
        });
        const qb = findQueByCode(arr.join(""));
        if (!qb || !qb.data) return null;
        const bienLines = {};
        haos.forEach(h => {
            const i = h - 1;
            const nb = qb.data.n[i].replace(/\(Thế\)|\(Ứng\)/g, "").trim().split(/\s+/);
            const chiB = nb[nb.length - 2];
            const hanhB = (typeof getHanh === "function" ? getHanh(nb[nb.length - 1]) : null) || CHI_HANH[chiB] || "";
            const ltB = (typeof tinhLucThan === "function") ? tinhLucThan(hanhB, cung.hanh) : nb.slice(0, -2).join(" ");
            bienLines[h] = { pos: h, chi: chiB, hanh: hanhB, lt: ltB, isBien: true };
        });
        return { name: qb.name, lines: bienLines };
    }

    function buildBoxCanNhac(lines) {
        const box = [];
        let tk = [];
        if (window.LH_BRIDGE && typeof window.LH_BRIDGE.collect === "function") {
            try {
                const B = window.LH_BRIDGE.collect();
                if (B.tuanKhong && B.tuanKhong.chi) tk = B.tuanKhong.chi.slice();
            } catch (e) { /* */ }
        }
        if (!tk.length && window.M02_DATA && window.M02_DATA.tuanKhongChi) tk = window.M02_DATA.tuanKhongChi.slice();
        if (tk.length) {
            lines.forEach(p => {
                if (tk.indexOf(p.chi) >= 0)
                    box.push("[TuanKhong] H" + p.pos + " " + p.lt + " " + p.chi + " lâm Không [" + tk.join(",") + "]");
            });
        } else box.push("[TuanKhong] Chưa có dữ liệu — tự xem m01 khi luận sâu.");

        if (window.M03_DATA && Array.isArray(window.M03_DATA.danhSachHaoMo) && window.M03_DATA.danhSachHaoMo.length) {
            window.M03_DATA.danhSachHaoMo.forEach(item => {
                box.push("[Mo] H" + item.hao + " kẹt Mộ " + (item.moTarget || "") + " — cân tay.");
            });
        } else box.push("[Mo] Chưa có M03_DATA — tự đối chiếu.");

        if (window.LucHaoModules && window.LucHaoModules.m06 && window.LucHaoModules.m06.results) {
            const res = window.LucHaoModules.m06.results;
            [1, 2, 3, 4, 5, 6].forEach(h => {
                const r = res[h];
                if (r && r.ketLuan && /Phá|Ám Động|XUNG/i.test(r.ketLuan))
                    box.push("[Pha] H" + h + ": " + r.ketLuan);
            });
        } else box.push("[Pha] Chưa có m06 — tự đối chiếu Xung/Phá.");

        return box;
    }

    /* ----- Sơ khảo chính ----- */
    function runTraCuu() {
        const q = resolveQue();
        if (!q) { alert("Chọn / gõ đúng tên 1 quẻ trong 64 quẻ."); return; }
        const haos = getSelectedHaos();
        if (haos.length > 4) { alert("Tối đa 4 hào động."); return; }
        const dtRaw = $("tc_dt").value;
        const quanCase = dtRaw === "Quan Quỷ" ? ($("tc_quanCase").value || "cat") : null;
        const tt = readTuTri();
        if (!tt.ok) {
            alert(tt.loi || "Thiếu Tứ Trị (cần ít nhất Nhật Chi + Nguyệt Chi).");
            return;
        }

        const chu = q.data;
        const lines = chu.n.map((n, i) => parseLine(n, i + 1));
        const T = lines.find(l => l.the);
        const U = lines.find(l => l.ung);
        if (!T || !U) { alert("Quẻ thiếu đánh dấu Thế/Ứng trong data."); return; }

        let dungLT = dtRaw;
        let dungHits = dungOnQue(q, dtRaw);
        let dungFromPhuc = false;
        let dungObj = null;

        if (dtRaw === "Thế") {
            dungLT = T.lt;
            dungObj = T;
            dungHits = [T];
        } else if (dungHits.length) {
            dungObj = dungHits.find(h => h.the) || dungHits[0];
        } else {
            // Phục
            const pLT = $("tc_phucLT").value || dtRaw;
            const pChi = $("tc_phucChi").value;
            const pPos = $("tc_phucPos").value ? +$("tc_phucPos").value : null;
            if (!pChi) {
                alert("Dụng Thần không lộ trên quẻ — hãy nhập Địa Chi Phục Thần (hoặc chọn Dụng khác).");
                $("tc_phucBox").style.display = "block";
                return;
            }
            dungFromPhuc = true;
            dungLT = pLT || dtRaw;
            dungObj = {
                pos: pPos || 0,
                lt: dungLT,
                chi: pChi,
                hanh: CHI_HANH[pChi] || "",
                the: false, ung: false, isBien: false, isPhuc: true
            };
        }

        const bien = buildBienMulti(chu, q.cung, haos);
        const thuMap = anLucThanThu(tt.nhatCan || "");

        // Vượng/Suy
        function vsOf(e) {
            if (!e || !e.chi) return { chuoi: "—", diem: 50 };
            const parts = [];
            let diem = 50, n = 0;
            if (tt.nguyetChi) {
                const v = layCapVuongSuy(e.chi, tt.nguyetChi, "Nguyệt");
                if (v.chuoi) { parts.push("Nguyệt:" + v.chuoi); diem += v.diem; n++; }
            }
            if (tt.nhatChi) {
                const v = layCapVuongSuy(e.chi, tt.nhatChi, "Nhật");
                if (v.chuoi) { parts.push("Nhật:" + v.chuoi); diem += v.diem; n++; }
            }
            return { chuoi: parts.join(" | ") || "—", diem: n ? Math.round(diem / n) : 50 };
        }

        const vsT = vsOf(T);
        const vsU = vsOf(U);
        const vsY = vsOf(dungObj);

        // Điểm nền
        let score = Math.round(vsT.diem * 0.28 + vsY.diem * 0.28 + 50 * 0.2);
        const notes = [];
        const tacNotes = [];

        function noteRel(label, shortPair, a, b, w) {
            const rd = relDir(a, b);
            if (rd.type === "none") return;
            if (rd.type === "hoa") {
                tacNotes.push(label + ": tỷ hòa");
                score += 2 * w;
                return;
            }
            const actorIsA = rd.from === "a";
            const type = rd.type;
            if (type === "sinh") {
                const receiver = actorIsA ? b : a;
                const giver = actorIsA ? a : b;
                if (receiver === T || receiver === dungObj) {
                    score += 8 * w;
                    tacNotes.push(label + ": có chiều SINH " + shortPair + " (+)");
                } else if (giver === T || giver === dungObj) {
                    score -= 5 * w;
                    const gn = giver === T ? "Thế" : "Dụng";
                    tacNotes.push(label + ": " + gn + " phải SINH ra ngoài qua " + shortPair + " (− nhẹ)");
                } else {
                    tacNotes.push(label + ": có chiều SINH " + shortPair);
                }
            } else {
                const victim = actorIsA ? b : a;
                if (victim === T) {
                    score -= 14 * w;
                    tacNotes.push(label + ": có chiều KHẮC " + shortPair + " (hướng Thế) (−)");
                } else if (victim === dungObj) {
                    score -= 12 * w;
                    tacNotes.push(label + ": có chiều KHẮC " + shortPair + " (hướng Dụng) (−)");
                } else {
                    tacNotes.push(label + ": có chiều KHẮC " + shortPair);
                }
            }
        }

        noteRel("Thế↔Dụng", "Thế/Dụng", T, dungObj, 1.2);
        noteRel("Thế↔Ứng", "Thế/Ứng", T, U, 1.0);
        noteRel("Ứng↔Dụng", "Ứng/Dụng", U, dungObj, 0.9);

        // Mỗi hào động
        const dongDetails = [];
        haos.forEach(h => {
            const D = lines[h - 1];
            const vsD = vsOf(D);
            const B = bien && bien.lines[h] ? bien.lines[h] : null;
            const vsB = B ? vsOf(B) : null;
            noteRel("Động H" + h + "↔Thế", "Động/Thế", D, T, 1.0);
            noteRel("Động H" + h + "↔Dụng", "Động/Dụng", D, dungObj, 1.0);
            noteRel("Động H" + h + "↔Ứng", "Động/Ứng", D, U, 0.6);
            if (B) {
                noteRel("Biến H" + h + "↔Thế", "Biến/Thế", B, T, 0.9);
                noteRel("Biến H" + h + "↔Dụng", "Biến/Dụng", B, dungObj, 0.9);
            }
            dongDetails.push({ h: h, D: D, vsD: vsD, B: B, vsB: vsB, thu: thuMap[h] });
        });

        // Lục Thần thú
        const thuT = thuMap[T.pos];
        const thuY = dungObj.pos ? thuMap[dungObj.pos] : null;
        if (dtRaw === "Quan Quỷ") {
            if (quanCase === "hung") {
                if (thuY && thuY !== "Thanh Long") { score -= 18; notes.push("Hung: Quan không lâm Thanh Long (−)"); }
                if (haos.some(h => lines[h - 1].lt === "Quan Quỷ")) { score -= 22; notes.push("Hung: Quan phát động (−)"); }
            } else {
                if (thuY === "Bạch Hổ") { score -= 22; notes.push("Cát: Quan lâm Bạch Hổ (−)"); }
            }
        }
        if (thuT === "Bạch Hổ") { score -= 6; notes.push("Thế lâm Bạch Hổ (−)"); }

        // Hard gate mềm
        const theOk = vsT.diem >= 55;
        const dungOk = vsY.diem >= 55;
        if (!theOk) { score = Math.min(score, 54); notes.push("Hard: Thế dưới Medium (Vượng/Suy)"); }
        if (!dungOk) { score = Math.min(score, 54); notes.push("Hard: Dụng dưới Medium (Vượng/Suy)"); }

        score = Math.max(0, Math.min(100, Math.round(score)));

        // Gọi MCL_CORE nếu đúng 1 hào động
        let mclBlock = "";
        if (haos.length === 1 && window.MCL_CORE && typeof window.MCL_CORE.phanTich === "function") {
            try {
                const dtForMcl = (dtRaw === "Thế") ? "" : (dungFromPhuc ? "" : dtRaw);
                const r = window.MCL_CORE.phanTich({
                    que: q,
                    hao: haos[0],
                    dt: dtForMcl
                });
                if (r && r.ok) {
                    mclBlock += "\n—— Trích MCL_CORE (Luận 1 hào động) ——\n";
                    mclBlock += "Kết luận MCL: " + (r.verdict || "—") + "\n";
                    if (r.nenTang) {
                        mclBlock += "Nền tảng Thế s1=" + r.nenTang.s1 +
                            " | 2.1=" + r.nenTang.s21 +
                            " | 2.2=" + r.nenTang.s22 +
                            " | 2.3=" + r.nenTang.s23 +
                            " | 2.4=" + r.nenTang.s24 + "\n";
                    }
                    if (r.nguyHiem) mclBlock += "🚨 MCL cảnh báo nguy hiểm nền tảng Thế.\n";
                    // Hòa nhẹ điểm MCL vào sơ khảo
                    if (r.nenTang) {
                        if (r.nenTang.s1 > 0) score = Math.min(100, score + 3);
                        if (r.nenTang.s1 < 0) score = Math.max(0, score - 5);
                        if (r.nguyHiem) score = Math.max(0, score - 8);
                    }
                }
            } catch (e) {
                mclBlock += "\n(MCL_CORE.phanTich lỗi: " + e.message + ")\n";
            }
        } else if (haos.length > 1) {
            mclBlock += "\n—— MCL_CORE ——\n";
            mclBlock += "Có " + haos.length + " hào động (>1): Luận MCL chi tiết từng cặp áp dụng trong sơ khảo phía trên; ";
            mclBlock += "module mchienluoc luận đầy đủ văn bản khi đúng 1 hào động.\n";
        }

        const boxNhac = buildBoxCanNhac(lines);

        // Text output
        let text = "=== TRA CỨU QUẺ — SƠ KHẢO ===\n";
        text += "Quẻ: " + q.name + " (Họ " + q.cung.name + " · " + q.cung.hanh + ")\n";
        text += "Hào động: " + (haos.length ? haos.map(h => "H" + h).join(", ") : "QUẺ TĨNH") + "\n";
        if (bien) text += "Quẻ Biến: " + bien.name + "\n";
        text += "Tứ Trị [" + tt.label + "]: Thời " + (tt.thoi || "—") +
            " | Nhật " + (tt.nhat || "—") + " | Nguyệt " + (tt.nguyet || "—") +
            " | Tuế " + (tt.thaiTue || "—") + "\n";
        text += "Dụng Thần chọn: " + (dtRaw || "—") +
            (dtRaw === "Thế" ? " → lấy Thế hào (" + T.lt + ")" : "") +
            (dungFromPhuc ? " [PHỤC]" : "") +
            (quanCase ? " | Case Quan: " + quanCase : "") + "\n\n";

        text += "• Thế H" + T.pos + " " + T.lt + " " + T.chi +
            " | VS: " + vsT.chuoi + " → " + mediumLabel(vsT.diem) +
            (thuT ? " | Thú: " + thuT : "") + "\n";
        text += "• Dụng " + (dungObj.isPhuc ? "[Phục] " : "H" + (dungObj.pos || "?") + " ") +
            dungObj.lt + " " + dungObj.chi +
            " | VS: " + vsY.chuoi + " → " + mediumLabel(vsY.diem) +
            (thuY ? " | Thú: " + thuY : "") + "\n";
        text += "• Ứng H" + U.pos + " " + U.lt + " " + U.chi +
            " | VS: " + vsU.chuoi + " → " + mediumLabel(vsU.diem) + "\n";

        dongDetails.forEach(d => {
            text += "• Động H" + d.h + " " + d.D.lt + " " + d.D.chi +
                " | VS: " + d.vsD.chuoi + " → " + mediumLabel(d.vsD.diem) +
                (d.thu ? " | Thú: " + d.thu : "") + "\n";
            if (d.B) {
                text += "  ↳ Biến H" + d.h + " " + d.B.lt + " " + d.B.chi +
                    " | VS: " + d.vsB.chuoi + " → " + mediumLabel(d.vsB.diem) + "\n";
            }
        });

        if (tacNotes.length) text += "\nTương tác: " + tacNotes.join("; ") + "\n";
        if (notes.length) text += "Ghi chú thú / hard: " + notes.join("; ") + "\n";

        text += "\n【 Điểm sơ khảo tổng hợp 】 " + score + "/100 — " + mediumLabel(score) + "\n";
        text += "(Thế & Dụng hard ≥ Cận Medium; hòa MCL khi 1 hào động; Không/Phá/Mộ không trừ điểm pass)\n";

        text += mclBlock;

        text += "\n【 Box Cân Nhắc — user tự cân 】\n";
        boxNhac.forEach(line => { text += "  - " + line + "\n"; });

        text += "\n=== HẾT TRA CỨU ===";

        const out = $("tc_output");
        out.value = text;
        out.style.display = "block";
        out.style.height = "auto";
        out.style.height = Math.min(out.scrollHeight + 6, 1800) + "px";
        $("tc_copyBtn").style.display = "inline-block";
        $("tc_fallbackBox").style.display = "none";

        window.TC_LAST_RESULT = {
            que: q.name, haos: haos, score: score, tuTri: tt,
            dung: dungObj, the: T, ung: U, bien: bien, text: text
        };
    }

    $("tc_runBtn").addEventListener("click", runTraCuu);

    $("tc_copyBtn").addEventListener("click", function () {
        const text = $("tc_output").value;
        if (!text) return;
        function ok() {
            $("tc_copyBtn").innerText = "✅ ĐÃ SAO CHÉP!";
            setTimeout(() => { $("tc_copyBtn").innerText = "📋 SAO CHÉP"; }, 2000);
        }
        function fb() {
            $("tc_fallbackBox").style.display = "block";
            $("tc_fallbackText").value = text;
            $("tc_fallbackText").focus();
            $("tc_fallbackText").select();
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(ok).catch(fb);
        } else fb();
    });

    // Đồng bộ preview khi Form Nền đổi
    ["mThoi", "mNhat", "mNguyet", "mThaiTue"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", function () {
            if ($("tc_timeSrc").value === "form") updateTimePreview();
        });
    });

    updateTimePreview();

    window.TRACUU_CORE = {
        version: 1,
        run: runTraCuu,
        readTuTri: readTuTri
    };
})();
