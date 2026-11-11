/* =========================================================================
 * mchienluoc.js — MODULE CHIẾN LƯỢC: LUẬN SINH KHẮC HÀO ĐỘNG ĐƠN (64 QUẺ)
 * (nâng cấp từ m06.js — Tra Cứu Hào Động Đơn)
 *
 * NẠP: gõ Tên Quẻ (tự gợi ý, tự nhận Họ Quẻ — KHÔNG cần chọn Họ trước) + chọn
 *      đúng 1 Hào Động (1-6) + (tuỳ chọn) chọn Dụng Thần  =>  tự luận giải.
 *
 * LIỆT KÊ: Họ Quẻ / Quẻ Chính / Quẻ Biến, Hào Động, Hào Biến, Thế, Ứng,
 *   Dụng Thần (tìm ở 6 hào Quẻ Chính; không có thì tìm ở Hào Biến; không có
 *   nữa thì báo "Dụng Thần không xuất hiện"), kèm Vượng Suy cơ bản theo
 *   Nhật/Nguyệt (đọc từ 2 ô Nhật Thần / Nguyệt Lệnh của phần Lập Quẻ & Xử Lý
 *   Dữ Liệu Lập Thời phía trên; chưa nhập thì bỏ qua phần Vượng Suy).
 *
 * LUẬN: Sinh / Khắc / Tỷ hòa giữa Thế – Ứng – Hào Động (cấp 1) – Hào Biến
 *   (cấp 2) – Dụng Thần, theo ngũ hành Địa Chi; diễn giải từng cặp; chấm các
 *   nền tảng của Chủ Thể (Thế) và đưa kết luận.
 *
 * TÁI DÙNG NGUYÊN XI hàm/biến nền của total.html: dataDich, getHanh,
 *   tinhLucThan, findQueByCode, VUONG_SUY_TABLE, resolveVuongSuy, moduleSlot.
 * Không đụng tới quẻ đang chọn ở phần Lập Quẻ chính (id tiền tố mcl_).
 * ========================================================================= */
(function () {
    "use strict";

    if (typeof dataDich === "undefined" || typeof moduleSlot !== "function") {
        console.error("mchienluoc.js: thiếu dataDich / moduleSlot của file gốc — module không chạy.");
        return;
    }

    // ---------- Hằng số ngũ hành ----------
    const CHI_HANH = {
        "Tý": "Thủy", "Hợi": "Thủy",
        "Dần": "Mộc", "Mão": "Mộc",
        "Tỵ": "Hỏa", "Ngọ": "Hỏa",
        "Thân": "Kim", "Dậu": "Kim",
        "Sửu": "Thổ", "Thìn": "Thổ", "Mùi": "Thổ", "Tuất": "Thổ"
    };
    const CHI_LIST_LOCAL = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
    const SINH = { "Kim": "Thủy", "Thủy": "Mộc", "Mộc": "Hỏa", "Hỏa": "Thổ", "Thổ": "Kim" };   // a sinh b
    const KHAC = { "Kim": "Mộc", "Mộc": "Thổ", "Thổ": "Thủy", "Thủy": "Hỏa", "Hỏa": "Kim" };   // a khắc b
    const DUNG_THAN = ["Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ"];
    const ROLE_NAME = { T: "Thế", U: "Ứng", D: "Hào Động", B: "Hào Biến", Y: "Dụng Thần" };

    // ---------- Tiện ích ----------
    function fold(s) {
        return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().replace(/\s+/g, " ").trim();
    }

    // Danh sách phẳng 64 quẻ để gõ-tìm (Họ Quẻ tự suy ra từ dataDich)
    const ALL_QUE = [];
    Object.keys(dataDich).forEach(cungKey => {
        Object.keys(dataDich[cungKey].quẻ).forEach(qName => {
            ALL_QUE.push({ name: qName, fold: fold(qName), cungKey: cungKey, cung: dataDich[cungKey], data: dataDich[cungKey].quẻ[qName] });
        });
    });

    // ---------- UI ----------
    const boxHtml = `
        <div class="header" style="border-bottom: 1px solid var(--gold); padding: 5px 0 10px 0; margin-bottom: 15px;">
            <h1 style="font-size: 1.1rem;">Module Chiến Lược — Luận Sinh Khắc Hào Động Đơn</h1>
        </div>
        <p style="font-size:0.72rem;color:#888;margin:0 0 12px;">
            Gõ Tên Quẻ (tự gợi ý, tự nhận Họ Quẻ), chọn 1 Hào Động và Dụng Thần (tuỳ chọn) — kết quả tự hiện.
            Vượng Suy lấy theo Nhật Thần / Nguyệt Lệnh đang nhập ở phần Lập Thời phía trên.
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
                    <option value="1">Hào 1</option>
                    <option value="2">Hào 2</option>
                    <option value="3">Hào 3</option>
                    <option value="4">Hào 4</option>
                    <option value="5">Hào 5</option>
                    <option value="6">Hào 6</option>
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
            <div class="fallback-hint">Trình duyệt chặn copy tự động — bấm vào ô trên để chọn hết rồi copy thủ công (Ctrl+C / giữ để copy)</div>
        </div>
    `;
    const box = moduleSlot(boxHtml);
    const $ = (id) => box.querySelector("#" + id);
    $("mcl_output").addEventListener("click", function () { this.select(); });
    $("mcl_fallbackText").addEventListener("click", function () { this.select(); });

    // ---------- Gõ tên quẻ: gợi ý + nhận Họ ----------
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
        else { setQue(null); }
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

    // ---------- Phân tích dòng hào ----------
    function parseLine(n, pos) {
        const clean = n.replace(/\(Thế\)|\(Ứng\)/g, "").trim();
        const w = clean.split(/\s+/);
        const chi = w[w.length - 2];
        const hanh = getHanh(w[w.length - 1]) || CHI_HANH[chi] || "";
        return {
            pos: pos, lt: w.slice(0, -2).join(" "), chi: chi, hanh: hanh,
            the: /\(Thế\)/.test(n), ung: /\(Ứng\)/.test(n), isBien: false
        };
    }

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

    // Quan hệ giữa a và b theo ngũ hành: {from:'a'|'b', type:'sinh'|'khac'} hoặc {type:'hoa'}
    function relDir(a, b) {
        if (a.hanh === b.hanh) return { type: "hoa" };
        if (SINH[a.hanh] === b.hanh) return { from: "a", type: "sinh" };
        if (KHAC[a.hanh] === b.hanh) return { from: "a", type: "khac" };
        if (SINH[b.hanh] === a.hanh) return { from: "b", type: "sinh" };
        if (KHAC[b.hanh] === a.hanh) return { from: "b", type: "khac" };
        return { type: "none" };
    }

    // Hào actor tác động lên target có hiệu lực không?
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

    // ---------- Diễn giải ----------
    const HOA_TEXT = "tỷ hòa (cùng ngũ hành): tiệm tiến, không bay như diều nhưng cũng không như thuyền gặp sóng";

    function meaning(a, t, type, ctx) {
        const cap = a === "B" ? "cấp 2" : "cấp 1";
        if (type === "hoa") return HOA_TEXT + ".";
        const key = a + ">" + t;
        switch (key) {
            case "T>U":
                return type === "sinh" ? "hao tổn, thất thoát, lòn cúi, quỵ lụy."
                    : "có chút thuận lợi ban đầu.";
            case "U>T":
                return type === "khac" ? "không lợi từ khởi đầu đến kết thúc."
                    : "có điểm thuận lợi, được giúp sức, được hỗ trợ.";
            case "D>T": case "B>T":
                return type === "khac" ? "biến động gây nguy hại (" + cap + (a === "B" ? ", lớn hơn cấp 1" : "") + ")."
                    : "biến động " + cap + " thuận lợi, nâng đỡ Chủ Thể.";
            case "D>U": case "B>U": {
                let s = type === "khac"
                    ? "biến động " + cap + " gây hại cho đối tượng/môi trường xung quanh Thế."
                    : "biến động " + cap + " sinh trợ cho đối tượng/điều kiện bên ngoài Thế.";
                if (ctx.UT === "Usinh") {
                    s += type === "khac"
                        ? " Vì Ứng sinh Thế (đồng minh/người hỗ trợ) nên nguy hại này ảnh hưởng XẤU cho Thế."
                        : " Vì Ứng sinh Thế nên đồng minh được tiếp sức, có lợi cho Thế.";
                } else if (ctx.UT === "Ukhac") {
                    s += type === "khac"
                        ? " Vì Ứng khắc Thế (khó khăn/cản trở) nay bị kìm hãm bớt nên ảnh hưởng có chút TÍCH CỰC cho Thế."
                        : " Vì Ứng khắc Thế nên cản trở được tiếp thêm lực, bất lợi cho Thế.";
                }
                return s;
            }
            case "T>D":
                return type === "sinh" ? "Thế phải sinh cho biến động cấp 1 = bỏ công mà lợi chẳng bao nhiêu."
                    : "Thế chế ngự được biến động cấp 1.";
            case "U>D":
                return type === "sinh" ? "bên ngoài (Ứng) tiếp sức cho biến động cấp 1."
                    : "bên ngoài (Ứng) kìm chế biến động cấp 1.";
            case "B>D":
                return type === "sinh" ? "biến động cấp 2 tiếp sức cho biến động cấp 1."
                    : "biến động cấp 2 kìm chế/phá biến động cấp 1 (hào Biến có quyền khắc hào Động).";
            case "D>B":
                return type === "sinh" ? "biến động cấp 1 sinh sang biến động cấp 2 (hào Động sinh hào Biến)."
                    : "KHÔNG có hiệu lực: hào Động không thể khắc hào Biến.";
            case "D>Y": case "B>Y":
                return type === "sinh" ? "thuận lợi " + cap + " về đối tượng đang xét (Dụng Thần)."
                    : "bất lợi " + cap + " về đối tượng đang xét (Dụng Thần).";
            case "Y>D": case "Y>B": {
                const c2 = t === "B" ? "cấp 2" : "cấp 1";
                return type === "sinh" ? "đối tượng cần xét sinh cho biến động " + c2 + "."
                    : "đối tượng cần xét khắc/kìm chế biến động " + c2 + ".";
            }
            case "Y>T":
                return type === "sinh" ? "đối tượng cần xét sinh cho Chủ Thể = có lợi."
                    : "đối tượng cần xét khắc Chủ Thể = bất lợi.";
            case "Y>U":
                return type === "sinh" ? "đối tượng cần xét sinh cho đối tượng/điều kiện bên ngoài Chủ Thể = có lợi cho bên ngoài."
                    : "đối tượng cần xét khắc đối tượng/điều kiện bên ngoài Chủ Thể = bất lợi cho bên ngoài.";
            case "T>Y":
                return type === "sinh" ? "Thế phải sinh cho đối tượng = bỏ công mà lợi chẳng bao nhiêu."
                    : "Thế khắc đối tượng: Chủ Thể chế ngự được đối tượng, có chút thuận lợi.";
            case "U>Y":
                return type === "sinh" ? "điều kiện bên ngoài (Ứng) sinh trợ cho đối tượng đang xét."
                    : "điều kiện bên ngoài (Ứng) khắc/cản trở đối tượng đang xét.";
            default:
                return "";
        }
    }

    // ---------- Luận giải chính ----------
    // opts (tuỳ chọn, do module khác như m08 gọi qua window.MCL_CORE): {que:{name,cung,data}, hao, dt}
    // Có opts => chạy đúng thuật toán này nhưng KHÔNG đọc/ghi UI của module, chỉ trả về object kết quả.
    function luanGiai(silent, opts) {
        const q = opts ? opts.que : resolveQue();
        const h = opts ? Number(opts.hao) : Number($("mcl_hao").value);
        if (!q || !h) {
            if (opts) return { ok: false, loi: "Thiếu Quẻ hoặc Hào Động." };
            if (!silent) alert("Vui lòng gõ/chọn Tên Quẻ hợp lệ và chọn đúng 1 Hào Động.");
            return;
        }
        const dtChon = opts ? (opts.dt || "") : $("mcl_dt").value;
        const cung = q.cung;
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

        // Quẻ Biến (lật đúng 1 bit, cùng quy ước findQueByCode)
        const arr = chu.c.split("");
        const bit = 6 - h;
        arr[bit] = arr[bit] === "1" ? "0" : "1";
        const qb = findQueByCode(arr.join(""));
        let B = null;
        if (qb) {
            const nb = qb.data.n[i].replace(/\(Thế\)|\(Ứng\)/g, "").trim().split(/\s+/);
            const chiB = nb[nb.length - 2];
            const hanhB = getHanh(nb[nb.length - 1]) || CHI_HANH[chiB] || "";
            B = { pos: h, chi: chiB, hanh: hanhB, lt: tinhLucThan(hanhB, cung.hanh), isBien: true };
            if (CHI_HANH[chiB] && hanhB !== CHI_HANH[chiB]) dataWarn.push("Hào Biến: hành trong data không khớp địa chi " + chiB);
        }

        // Nhật / Nguyệt cho Vượng Suy
        const nhatChi = chiFromInput("mNhat");
        const nguyetChi = chiFromInput("mNguyet");
        function vuongSuy(e) {
            if ((!nhatChi && !nguyetChi) || typeof VUONG_SUY_TABLE === "undefined" || !VUONG_SUY_TABLE[e.chi]) return null;
            const tb = VUONG_SUY_TABLE[e.chi];
            const parts = [];
            if (nhatChi && tb[nhatChi]) parts.push("Nhật " + nhatChi + ": " + resolveVuongSuy(tb[nhatChi], "Nhật"));
            if (nguyetChi && tb[nguyetChi]) parts.push("Nguyệt " + nguyetChi + ": " + resolveVuongSuy(tb[nguyetChi], "Nguyệt"));
            return parts.join(" | ");
        }

        // Dụng Thần
        const foldDt = fold(dtChon);
        let Ys = [];
        let yFromBien = false;
        if (dtChon) {
            Ys = lines.filter(l => fold(l.lt) === foldDt);
            if (!Ys.length && B && fold(B.lt) === foldDt) yFromBien = true;
        }
        const indepY = Ys.filter(y => y.pos !== T.pos && y.pos !== U.pos && y.pos !== D.pos);

        const L = (e) => e.isBien
            ? "vị trí hào " + e.pos + ": " + e.lt + " " + e.chi + " (" + e.hanh + ")"
            : "Hào " + e.pos + " " + e.lt + " " + e.chi + " (" + e.hanh + ")";
        const tagsOf = (e) => {
            const t = [];
            if (!e.isBien) {
                if (e.pos === T.pos) t.push("Thế");
                if (e.pos === U.pos) t.push("Ứng");
                if (e.pos === D.pos) t.push("Hào Động");
                if (Ys.indexOf(e) !== -1) t.push("Dụng Thần");
            }
            return t;
        };

        // ===== Phần 1: liệt kê =====
        let text = "=== MODULE CHIẾN LƯỢC — LUẬN SINH KHẮC HÀO ĐỘNG ĐƠN ===\n";
        text += "Quẻ Chính : " + q.name + " (Họ " + cung.name + " - " + cung.hanh + ")\n";
        text += B ? "Quẻ Biến  : " + qb.name + " (Họ " + qb.cung.name + " - " + qb.cung.hanh + ")\n"
                  : "Quẻ Biến  : (không tìm thấy trong data 64 quẻ — kiểm tra lại data)\n";
        text += "Nhật: " + (nhatChi || "chưa nhập") + " | Nguyệt: " + (nguyetChi || "chưa nhập") + "\n";
        if (dataWarn.length) text += "⚠ Cảnh báo data: " + dataWarn.join("; ") + "\n";

        text += "\n[1] CÁC HÀO ĐƯỢC LIỆT KÊ\n";
        const showLine = (name, e) => {
            const tg = tagsOf(e).filter(x => x !== name);
            let s = "• " + name + ": " + L(e) + (tg.length ? "  [trùng " + tg.join(", ") + "]" : "") + "\n";
            const vs = vuongSuy(e);
            if (vs) s += "    Vượng suy → " + vs + "\n";
            return s;
        };
        text += showLine("Hào Động", D);
        if (B) text += showLine("Hào Biến", B); else text += "• Hào Biến: (không xác định)\n";
        text += showLine("Hào Thế", T);
        text += showLine("Hào Ứng", U);

        if (!dtChon) {
            text += "• Dụng Thần: (chưa chọn)\n";
        } else if (Ys.length) {
            Ys.forEach(y => {
                const tg = tagsOf(y).filter(x => x !== "Dụng Thần");
                text += "• Dụng Thần " + dtChon + ": " + L(y) + (tg.length ? "  [trùng " + tg.join(", ") + "]" : "") + "\n";
                const vs = vuongSuy(y);
                if (vs) text += "    Vượng suy → " + vs + "\n";
            });
        } else if (yFromBien) {
            text += "• Dụng Thần " + dtChon + ": không có ở 6 hào Quẻ Chính, nhưng xuất hiện ở Hào Biến (" + L(B) + ")" + " — xét như Hào Biến\n";
            const vs = vuongSuy(B);
            if (vs) text += "    Vượng suy → " + vs + "\n";
        } else {
            text += "• Dụng Thần " + dtChon + ": ❌ DỤNG THẦN KHÔNG XUẤT HIỆN (không có ở 6 hào Quẻ Chính lẫn Hào Biến)\n";
        }
        if (!nhatChi && !nguyetChi) text += "(Chưa nhập Nhật/Nguyệt ở phần Lập Thời phía trên nên chưa có Vượng Suy.)\n";

        // ===== Phần 2: sinh / khắc =====
        const roles = [{ r: "T", e: T }, { r: "U", e: U }, { r: "D", e: D }];
        if (B) roles.push({ r: "B", e: B });
        indepY.forEach(y => roles.push({ r: "Y", e: y }));
        const sameLine = (x, y) => !x.e.isBien && !y.e.isBien && x.e.pos === y.e.pos;

        const relUT = relDir(U, T);
        const ctx = { UT: relUT.type === "hoa" ? "hoa" : (relUT.from === "a" ? (relUT.type === "sinh" ? "Usinh" : "Ukhac") : (relUT.type === "sinh" ? "Tsinh" : "Tkhac")) };

        const PAIR_GROUPS = [
            { title: "THẾ ↔ ỨNG", pairs: [["T", "U"]] },
            { title: "HÀO ĐỘNG (cấp 1) ↔ THẾ / ỨNG", pairs: [["D", "T"], ["D", "U"]] },
            { title: "HÀO BIẾN (cấp 2) ↔ THẾ / ỨNG / HÀO ĐỘNG", pairs: [["B", "T"], ["B", "U"], ["B", "D"]] },
            { title: "DỤNG THẦN ĐỘC LẬP ↔ CÁC HÀO", pairs: [["T", "Y"], ["U", "Y"], ["D", "Y"], ["B", "Y"]] }
        ];

        const E = [];            // các quan hệ có hiệu lực / có ghi nhận
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
                            // Hào Biến chỉ có chiều tác động sinh/khắc lên Thế/Ứng, không xét tỷ hòa với Thế/Ứng
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

        // Thế & Ứng cùng ngũ hành, cùng được/ bị Hào Động / Hào Biến sinh/khắc
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

        // ===== Phần 3: nền tảng của Chủ Thể (Thế) =====
        const nm = (e) => "[" + ROLE_NAME[e.r] + " " + e.chi + "]";
        const toT = E.filter(x => x.t === "T" && x.type !== "hoa");
        const sinhIn = toT.filter(x => x.type === "sinh");
        const khacIn = toT.filter(x => x.type === "khac");
        const listActors = (arr) => arr.length ? arr.map(x => ROLE_NAME[x.a] + " " + x.ae.chi).join(", ") : "không có";

        // Nền tảng 1
        let s1 = 0;
        let nguyHiem = false;
        if (khacIn.length === 0) s1 = sinhIn.length > 0 ? 1 : 0;
        else if (sinhIn.length > khacIn.length) s1 = 1;
        else if (sinhIn.length === khacIn.length) s1 = 0;
        else { s1 = -1; if (khacIn.length >= 2) nguyHiem = true; }

        // 2.1 Thế – Ứng
        let s21 = 0;
        let t21 = "";
        const eUT = E.find(x => (x.a === "U" && x.t === "T") || (x.a === "T" && x.t === "U"));
        if (eUT) {
            if (eUT.type === "hoa") { s21 = 0; t21 = "Thế tỷ hòa Ứng — tiệm tiến."; }
            else if (eUT.a === "U" && eUT.type === "khac") { s21 = -1; t21 = "Ứng khắc Thế — bị phá rối."; }
            else if (eUT.a === "T" && eUT.type === "sinh") { s21 = -1; t21 = "Thế sinh Ứng — hao tổn, bị phá rối."; }
            else if (eUT.a === "U" && eUT.type === "sinh") { s21 = 1; t21 = "Ứng sinh Thế — ít bị phá rối, được hỗ trợ."; }
            else { s21 = 1; t21 = "Thế khắc Ứng — ít bị phá rối, có chút thuận lợi ban đầu."; }
        }

        // 2.2 Hào Động / Hào Biến lên Thế
        const dbToT = E.filter(x => x.t === "T" && (x.a === "D" || x.a === "B") && x.type !== "hoa");
        const dbKhac = dbToT.filter(x => x.type === "khac");
        const s22 = dbKhac.length ? -1 : 1;
        const t22 = dbKhac.length
            ? "bị " + dbKhac.map(x => ROLE_NAME[x.a] + " " + x.ae.chi + " (" + (x.a === "B" ? "cấp 2" : "cấp 1") + ")").join(", ") + " khắc."
            : "không bị Hào Động / Hào Biến khắc" + (dbToT.length ? " (còn được " + dbToT.map(x => ROLE_NAME[x.a]).join(", ") + " sinh)." : ".");

        // 2.3 / 2.4 Thế – Dụng Thần
        const yList = [];
        Ys.forEach(y => yList.push(y));
        if (yFromBien) yList.push(B);
        const st23 = [];
        const tx23 = [];
        let hoaY = false;
        yList.forEach(y => {
            if (!y.isBien && y.pos === T.pos) { tx23.push("Dụng Thần chính là Thế (đối tượng = chủ thể)."); return; }
            const rd = relDir(y, T);
            const yn = y.isBien ? "Hào Biến " + y.chi : "Hào " + y.pos + " " + y.chi;
            if (rd.type === "hoa") {
                if (y.isBien) { tx23.push(yn + " (Dụng Thần là Hào Biến) không xét tỷ hòa với Thế."); return; }
                hoaY = true; tx23.push("Thế tỷ hòa Dụng Thần (" + yn + ")."); return;
            }
            if (y.isBien && rd.from !== "a") { tx23.push("Dụng Thần là Hào Biến nên Thế không tác động lên nó."); return; }
            if (rd.from === "a") {
                if (rd.type === "sinh") { st23.push(1); tx23.push("Dụng Thần (" + yn + ") sinh Thế — có lợi."); }
                else { st23.push(-1); tx23.push("Dụng Thần (" + yn + ") khắc Thế — bất lợi."); }
            } else {
                if (rd.type === "sinh") { st23.push(-1); tx23.push("Thế sinh Dụng Thần (" + yn + ") — bỏ công mà lợi chẳng bao nhiêu."); }
                else { st23.push(1); tx23.push("Thế khắc Dụng Thần (" + yn + ") — chế ngự được đối tượng, có chút thuận lợi."); }
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
        text += mark(s1) + " Nền tảng 1 — Thế ổn (được sinh nhiều, bị khắc ít): được sinh bởi [" + listActors(sinhIn) + "]; bị khắc bởi [" + listActors(khacIn) + "].\n";
        if (nguyHiem) text += "   🚨 CẢNH BÁO: NGUY HIỂM — Thế bị khắc nhiều mà cái sinh cho nó ít.\n";
        text += mark(s21) + " Nền tảng 2.1 — Thế ít bị Ứng phá rối: " + (t21 || "không có dữ liệu.") + "\n";
        text += mark(s22) + " Nền tảng 2.2 — Thế ít/không bị Hào Động, Hào Biến khắc: " + t22 + "\n";
        if (!dtChon) {
            text += "— Nền tảng 2.3 / 2.4 — chưa chọn Dụng Thần.\n";
        } else if (!yList.length) {
            text += "— Nền tảng 2.3 / 2.4 — Dụng Thần không xuất hiện nên không xét.\n";
        } else {
            text += mark(s23) + " Nền tảng 2.3 — Thế được Dụng Thần sinh: " + (tx23.filter(t => /sinh|khắc|chính là|Hào Biến/.test(t) && !/tỷ hòa/.test(t)).join(" ") || "không có quan hệ sinh/khắc đáng kể.") + "\n";
            text += mark(s24) + " Nền tảng 2.4 — Thế tỷ hòa Dụng Thần: " + (hoaY ? "có (tiệm tiến, tốt)." : "không.") + "\n";
        }

        // Trường hợp A / B / tỷ hòa của Thế
        const theSinh = E.filter(x => x.a === "T" && x.type === "sinh");
        const theHoa = E.filter(x => x.type === "hoa" && (x.a === "T" || x.t === "T"));
        text += "\nTình trạng Thế:\n";
        let anyCase = false;
        if (theSinh.length) {
            anyCase = true;
            text += "• Thế phải đi SINH cho [" + theSinh.map(x => ROLE_NAME[x.t] + " " + x.te.chi).join(", ") + "] = bỏ công mà lợi chẳng bao nhiêu, như bỏ công bắt tép nuôi cò.\n";
        }
        if (khacIn.length) {
            anyCase = true;
            text += "• Thế bị [" + khacIn.map(x => ROLE_NAME[x.a] + " " + x.ae.chi).join(", ") + "] KHẮC = vừa mất công vừa lâm vào nguy hại sụp đổ.\n";
        }
        if (theHoa.length) {
            anyCase = true;
            text += "• Thế tỷ hòa với [" + theHoa.map(x => ROLE_NAME[x.a === "T" ? x.t : x.a] + " " + (x.a === "T" ? x.te.chi : x.ae.chi)).join(", ") + "] = tiệm tiến, không bay như diều nhưng cũng không như thuyền gặp sóng.\n";
        }
        if (!anyCase) text += "• Thế không bị tác động đáng kể.\n";

        // ===== Phần 4: kết luận =====
        const eTD = E.find(x => x.a === "T" && x.t === "D" && x.type === "sinh");
        const s25 = eTD ? -1 : 0;
        if (eTD) text += "✘ Nền tảng phụ — Thế phải sinh cho Hào Động (bỏ công): tính là 1 điểm bất lợi.\n";
        const others = [s21, s22, s25].concat(dtChon && yList.length ? [s23, s24] : []);
        const goods = others.filter(v => v > 0).length;
        const bads = others.filter(v => v < 0).length;
        let verdict;
        if (nguyHiem) verdict = "🚨 NGUY HIỂM — TIÊU CỰC, dễ THẤT BẠI.";
        else if (s1 < 0) verdict = "❌ TIÊU CỰC — NGUY HẠI (nền tảng 1 của Thế không vững thì các nền tảng sau khó cứu).";
        else if (s1 > 0) {
            if (bads === 0) verdict = "✅ THUẬN LỢI, ổn, có thể đạt tích cực & hy vọng.";
            else if (goods > bads) verdict = "🟢 KHÁ THUẬN LỢI nhưng còn trở ngại (" + bads + " điểm bất lợi).";
            else if (goods === bads) verdict = "⚖ GIẰNG CO — có lợi có hại ngang nhau, tiệm tiến.";
            else verdict = "❌ TIÊU CỰC — Thế khá ổn nhưng các điều kiện còn lại bất lợi.";
        } else {
            const net = goods - bads;
            if (net >= 2) verdict = "🟢 THUẬN LỢI NHẸ.";
            else if (net === 1) verdict = "🟢 HƠI THUẬN LỢI.";
            else if (net === 0) verdict = "⚖ TRUNG TÍNH — tiệm tiến, không đột biến.";
            else verdict = "❌ TIÊU CỰC — bất lợi.";
        }
        text += "\n[4] KẾT LUẬN\n" + verdict + "\n";
        text += "(Nền tảng 1: " + mark(s1) + " | Điều kiện phụ: " + goods + " thuận lợi, " + bads + " bất lợi)\n";
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

    // ---------- Sao chép ----------
    function copyKetQua() {
        const text = $("mcl_output").value;
        if (!text) return;
        function showSuccess() {
            const btn = $("mcl_copyBtn");
            $("mcl_fallbackBox").style.display = "none";
            btn.innerText = "✅ ĐÃ SAO CHÉP!";
            setTimeout(() => { btn.innerText = "📋 SAO CHÉP KẾT QUẢ"; }, 2000);
        }
        function showFallback() {
            const fbBox = $("mcl_fallbackBox");
            const ta = $("mcl_fallbackText");
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

    // ---------- Gắn sự kiện ----------
    $("mcl_hao").addEventListener("change", autoRun);
    $("mcl_dt").addEventListener("change", autoRun);
    $("mcl_runBtn").addEventListener("click", function () { luanGiai(false); });
    $("mcl_copyBtn").addEventListener("click", copyKetQua);
    // Đổi Nhật/Nguyệt ở phần Lập Thời → luận lại (nếu đã có kết quả)
    ["mNhat", "mNguyet"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("change", function () { if ($("mcl_output").style.display === "block") autoRun(); });
    });

    // ---------- Cầu nối cho module khác (m08...) — chỉ THÊM, không đổi hành vi UI ----------
    window.MCL_CORE = {
        version: 1,
        phanTich: function (opts) { return luanGiai(true, opts || {}); },
        parseLine: parseLine, relDir: relDir, meaning: meaning,
        ROLE_NAME: ROLE_NAME, CHI_HANH: CHI_HANH
    };

})();