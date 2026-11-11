/**
 * Module m09.js: Bộ Lọc Chiến Lược & Tìm Quẻ Ngũ Linh / Lục Hào Cổ Pháp
 * Đóng vai trò Bộ Điều Hướng (Routing Engine):
 * 1. Gọi calendar-core.js lấy Tứ Trị từng mốc thời gian (Time A -> Time B).
 * 2. Gọi m01 -> m08 để lấy dữ liệu 64 quẻ, 384 hào và điểm Vượng Suy tương tác.
 * 3. Thực thi điều kiện lọc (Bảo vệ Thế, Dụng Thân >= Medium, Lọc Quan Quỷ, Bạch Hổ).
 */

window.StrategyFinderModule = (function () {

    // Quy ước ngưỡng điểm từ m02 - m08 (Medium = 3)
    const SCORE_MEDIUM = 3;

    /**
     * CỔNG KẾT NỐI 1: Lấy Tứ Trị từ calendar-core.js
     */
    function fetchTuTriFromCalendar(dateObj) {
        let core = window.CalendarCore || window.NL_Calendar || window;
        let ctx = null;

        try {
            if (core.NL_getDayContext) {
                ctx = core.NL_getDayContext(dateObj);
            } else if (typeof NL_getDayContext === 'function') {
                ctx = NL_getDayContext(dateObj);
            }
        } catch (err) {
            console.error("m09 error calling CalendarCore:", err);
        }

        if (ctx) {
            return {
                gioCanChi: ctx.gioCanChi || ctx.gio || "",
                ngayCanChi: ctx.ngayCanChi || ctx.ngay || "",
                thangCanChi: ctx.thangCanChi || ctx.thang || "",
                namCanChi: ctx.namCanChi || ctx.nam || "",
                tietKhi: ctx.tietKhi || ""
            };
        }

        // Dữ liệu dự phòng nếu chưa load kịp calendar-core
        return {
            gioCanChi: "Bính Tý",
            ngayCanChi: "Mậu Sửu",
            thangCanChi: "Kỷ Hợi",
            namCanChi: "Bính Ngọ",
            tietKhi: "Tiểu Tuyết"
        };
    }

    /**
     * CỔNG KẾT NỐI 2: Gọi m01 -> m08 để tính toán trạng thái
     */
    function evaluateHaoStatus(hao, tuTri) {
        if (!hao) return { score: 0, isOk: false, desc: "Không có hào" };

        let score = SCORE_MEDIUM;
        let desc = "Bình hòa";

        // Thử gọi module m02 chuyên tính Vượng Suy Hưu Tù Tử
        if (window.ModuleM02 && typeof window.ModuleM02.calcVuangSuy === 'function') {
            try {
                let res = window.ModuleM02.calcVuangSuy(hao, tuTri);
                score = res.score;
                desc = res.desc;
            } catch (e) {
                console.warn("m09: m02 calc error, fallbacking logic", e);
            }
        } else {
            // Logic fallback đơn giản nếu m02 chưa được gắn vào window
            if (hao.isNguyetTruc || hao.isNhatTruc) { score = 4; desc = "Trực Nhật/Nguyệt"; }
            else if (hao.isNguyetSinh || hao.isNhatSinh) { score = 3.5; desc = "Được Sinh"; }
            else if (hao.isNguyetPha) { score = 0; desc = "Nguyệt Phá"; }
            else if (hao.isNhatMo) { score = 1.5; desc = "Nhập Mộ"; }
        }

        return {
            score: score,
            isOk: score >= SCORE_MEDIUM,
            desc: desc
        };
    }

    /**
     * BỘ THUẬT TOÁN QUÉT VÒNG LẶP & LỌC ĐIỀU KIỆN (GATEKEEPER)
     */
    function executeSearch(params) {
        const results = [];
        const startDt = new Date(params.startTime);
        const endDt = new Date(params.endTime);
        const targetLucThan = params.targetLucThan || "Thê Tài";
        const quanQuyOpt = params.quanQuyOption || "CAT_THAN";

        // Lấy danh sách 64 quẻ từ m01
        let allQueList = [];
        if (window.ModuleM01 && typeof window.ModuleM01.getAll64Que === 'function') {
            allQueList = window.ModuleM01.getAll64Que();
        } else if (typeof getAll64Que === 'function') {
            allQueList = getAll64Que();
        }

        if (!allQueList || allQueList.length === 0) {
            console.error("m09: Không lấy được data 64 quẻ từ Module m01!");
            return results;
        }

        // Bước nhảy thời gian: Nhảy từng 2 tiếng (1 canh giờ Tứ Trị)
        const stepMs = 2 * 3600 * 1000;
        let currTime = startDt.getTime();
        const endMs = endDt.getTime();
        let limitCount = 0;

        while (currTime <= endMs && limitCount < 120) {
            const currentDate = new Date(currTime);
            const tuTri = fetchTuTriFromCalendar(currentDate);
            limitCount++;

            allQueList.forEach(que => {
                const cases = que.possibleDongCases || [que];
                cases.forEach(queCase => {
                    let haoList = queCase.haoList || [];
                    let lucThanHao = haoList.find(h => h.lucThan === targetLucThan);
                    let theHao = haoList.find(h => h.isThe);
                    let ungHao = haoList.find(h => h.isUng);
                    let dongList = haoList.filter(h => h.isDong);

                    if (!lucThanHao || !theHao) return;

                    // 1. Nhờ m02 - m08 đánh giá điểm
                    const evalLucThan = evaluateHaoStatus(lucThanHao, tuTri);
                    const evalThe = evaluateHaoStatus(theHao, tuTri);

                    // 2. TIÊU CHÍ BẮT BUỘC: Dụng Thần & Thế hào phải >= Medium (3.0)
                    if (!evalLucThan.isOk || !evalThe.isOk) return;

                    // 3. TIÊU CHÍ QUAN QUỶ (Cát Thần / Hung Thần)
                    if (targetLucThan === "Quan Quỷ") {
                        if (quanQuyOpt === "CAT_THAN" && lucThanHao.lucThanName === "Bạch Hổ") return;
                        if (quanQuyOpt === "HUNG_THAN") {
                            if (lucThanHao.isDong || lucThanHao.lucThanName !== "Thanh Long") return;
                        }
                    }

                    // 4. TIÊU CHÍ BẢO VỆ THẾ: Bạch Hổ không được động khắc Thế
                    let isBachHoRisk = haoList.some(h => h.isDong && h.lucThanName === "Bạch Hổ");
                    if (isBachHoRisk) return;

                    // THỎA MÃN TẤT CẢ TIÊU CHÍ CỦA M09 -> CHO QUA CỔNG
                    results.push({
                        timeStr: currentDate.toLocaleString('vi-VN'),
                        tuTri: tuTri,
                        tenQue: queCase.tenQue || que.tenQue,
                        haoDongText: dongList.map(h => h.index).join(", ") || "Tĩnh",
                        lucThanEval: evalLucThan,
                        theEval: evalThe
                    });
                });
            });

            currTime += stepMs;
        }

        return results;
    }

    /**
     * GIAO DIỆN HIỂN THỊ CỦA M09
     */
    function initUI() {
        if (document.getElementById("m09-app-box")) return;

        const div = document.createElement("div");
        div.id = "m09-app-box";
        div.style.cssText = "margin: 20px auto; padding: 15px; max-width: 800px; background: #fff8e7; border: 2px solid #8b0000; border-radius: 8px; font-family: sans-serif;";
        
        const now = new Date();
        const startIso = now.toISOString().slice(0, 16);
        const endIso = new Date(now.getTime() + 24*3600*1000).toISOString().slice(0, 16);

        div.innerHTML = `
            <h3 style="color:#8b0000; text-align:center; margin-top:0;">MODULE M09: TÌM QUẺ CHIẾN LƯỢC (GATEKEEPER ENGINE)</h3>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <div style="flex:1;">
                    <label><b>Từ mốc A:</b></label>
                    <input type="datetime-local" id="m09-start" value="${startIso}" style="width:100%; padding:5px;"/>
                </div>
                <div style="flex:1;">
                    <label><b>Đến mốc B:</b></label>
                    <input type="datetime-local" id="m09-end" value="${endIso}" style="width:100%; padding:5px;"/>
                </div>
            </div>
            <div style="margin-bottom:15px;">
                <label><b>Chọn Lục Thân Cần Tìm (Dụng Thần):</b></label>
                <select id="m09-luc-than" style="width:100%; padding:6px;">
                    <option value="Thê Tài">Thê Tài (Cầu Tài, Hôn Nhân Nữ)</option>
                    <option value="Phụ Mẫu">Phụ Mẫu (Giấy Tờ, Học Hành, Nhà Cửa)</option>
                    <option value="Huynh Đệ">Huynh Đệ (Đối Tác, Bạn Bè)</option>
                    <option value="Tử Tôn">Tử Tôn (May Mắn, Con Cái, Giải Tai)</option>
                    <option value="Quan Quỷ">Quan Quỷ (Công Danh, Chức Vụ)</option>
                </select>
            </div>
            <div style="text-align:center; margin-bottom:15px;">
                <button id="m09-btn-run" style="background:#8b0000; color:#fff; font-weight:bold; border:none; padding:10px 20px; border-radius:4px; cursor:pointer;">
                    BẮT ĐẦU QUÉT TỨ TRỊ & LỌC QUẺ
                </button>
            </div>
            <div id="m09-results" style="background:#fff; padding:10px; border:1px solid #ccc; max-height:400px; overflow-y:auto;">
                <p style="text-align:center; color:#666;">Chọn khoảng thời gian và bấm nút để bắt đầu tìm quẻ.</p>
            </div>
        `;

        document.body.appendChild(div);

        document.getElementById("m09-btn-run").addEventListener("click", function() {
            const resBox = document.getElementById("m09-results");
            resBox.innerHTML = "<p style='text-align:center; color:orange;'><b>Đang gọi calendar-core và m01-m08 để quét dữ liệu...</b></p>";

            setTimeout(() => {
                const list = executeSearch({
                    startTime: document.getElementById("m09-start").value,
                    endTime: document.getElementById("m09-end").value,
                    targetLucThan: document.getElementById("m09-luc-than").value
                });

                if (list.length === 0) {
                    resBox.innerHTML = "<p style='color:red; text-align:center;'>Không tìm thấy quẻ nào thỏa mãn toàn bộ tiêu chí bảo vệ Thế và Dụng Thân đạt Medium trong khoảng thời gian này.</p>";
                    return;
                }

                let html = `<p style='color:green; font-weight:bold;'>Đã lọc thành công ${list.length} quẻ đạt yêu cầu chuẩn Cổ Pháp:</p><ol>`;
                list.forEach(item => {
                    html += `
                        <li style="margin-bottom:8px; border-bottom:1px dashed #eee; padding-bottom:5px;">
                            <b>[${item.timeStr}]</b> - Tứ Trị: ${item.tuTri.namCanChi} / ${item.tuTri.thangCanChi} / ${item.tuTri.ngayCanChi} / ${item.tuTri.gioCanChi}<br/>
                            <b>Quẻ: ${item.tenQue}</b> (Hào động: ${item.haoDongText})<br/>
                            <small>&rarr; Dụng Thần: ${item.lucThanEval.desc} | Thế Hào: ${item.theEval.desc}</small>
                        </li>
                    `;
                });
                html += "</ol>";
                resBox.innerHTML = html;
            }, 50);
        });
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(initUI, 300);
    } else {
        document.addEventListener("DOMContentLoaded", initUI);
    }

    return {
        executeSearch: executeSearch,
        fetchTuTriFromCalendar: fetchTuTriFromCalendar
    };
})();
