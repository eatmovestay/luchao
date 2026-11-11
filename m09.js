/**
 * Module m09.js: Bộ Lọc Chiến Lược Ngũ Linh / Lục Hào Cổ Pháp
 * Đóng vai trò Bộ Điều Hướng (Routing Engine):
 * 1. Nhận mốc thời gian A -> B.
 * 2. Gọi calendar-core.js lấy Can Chi Tứ Trị thực tế từng canh giờ.
 * 3. Chuyển Tứ Trị sang m01 -> m08 để đánh giá 64 quẻ (384 hào).
 * 4. Thực thi quy tắc lọc: Dụng Thần & Hào Thế phải >= Medium (3.0), loại Bạch Hổ/Hung thần.
 */

window.StrategyFinderModule = (function () {

    const SCORE_MEDIUM = 3.0; // Ngưỡng Medium theo quy chuẩn m02-m08

    /**
     * 1. CỔNG KẾT NỐI CALENDAR-CORE: Lấy Tứ Trị Can Chi
     */
    function getTuTriFromCore(dateObj) {
        let core = window.CalendarCore || window.NL_Calendar || window;
        let ctx = null;

        try {
            if (core && typeof core.NL_getDayContext === 'function') {
                ctx = core.NL_getDayContext(dateObj);
            } else if (typeof NL_getDayContext === 'function') {
                ctx = NL_getDayContext(dateObj);
            }
        } catch (err) {
            console.warn("m09: Lỗi kết nối CalendarCore, dùng fallback", err);
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

        // Fallback dữ liệu chuẩn nếu core chưa load xong
        return {
            gioCanChi: "Bính Tý",
            ngayCanChi: "Mậu Sửu",
            thangCanChi: "Kỷ Hợi",
            namCanChi: "Bính Ngọ",
            tietKhi: "Tiểu Tuyết"
        };
    }

    /**
     * 2. CỔNG KẾT NỐI M02 - M08: Đánh giá điểm Vượng Suy Hưu Tù Tử
     */
    function evaluateHaoWithCore(hao, tuTri) {
        if (!hao) return { score: 0, isOk: false, desc: "Không có hào" };

        let score = SCORE_MEDIUM;
        let desc = "Bình hòa (Medium)";

        // Gọi module m02 chuyên tính toán
        if (window.ModuleM02 && typeof window.ModuleM02.calcVuangSuy === 'function') {
            try {
                let res = window.ModuleM02.calcVuangSuy(hao, tuTri);
                score = res.score;
                desc = res.desc;
            } catch (e) {
                console.warn("m09: m02 calc error", e);
            }
        } else {
            // Fallback logic Cổ Pháp cơ bản nếu m02 chưa gắn window
            if (hao.isNguyetTruc || hao.isNhatTruc) { score = 4.0; desc = "Trực Nhật/Nguyệt (Vượng)"; }
            else if (hao.isNguyetSinh || hao.isNhatSinh) { score = 3.5; desc = "Được Sinh (Medium+)"; }
            else if (hao.isNguyetPha) { score = 0; desc = "Nguyệt Phá (Tuyệt)"; }
            else if (hao.isNhatMo) { score = 1.5; desc = "Nhập Mộ (Suy)"; }
        }

        return {
            score: score,
            isOk: score >= SCORE_MEDIUM,
            desc: desc
        };
    }

    /**
     * 3. ENGINE QUÉT THỜI GIAN A -> B X 64 QUẺ X 384 HÀO
     */
    function runSearchEngine(params) {
        const results = [];
        const startDt = params.startTime ? new Date(params.startTime) : new Date();
        const endDt = params.endTime ? new Date(params.endTime) : new Date(startDt.getTime() + 24 * 3600 * 1000);
        const targetLucThan = params.targetLucThan || "Thê Tài";
        const quanQuyOpt = params.quanQuyOption || "CAT_THAN";

        // Lấy 64 quẻ từ m01
        let allQueList = [];
        if (window.ModuleM01 && typeof window.ModuleM01.getAll64Que === 'function') {
            allQueList = window.ModuleM01.getAll64Que();
        } else if (typeof getAll64Que === 'function') {
            allQueList = getAll64Que();
        }

        if (!allQueList || allQueList.length === 0) {
            console.error("m09: Chưa lấy được dữ liệu 64 quẻ từ m01!");
            return results;
        }

        // Bước nhảy thời gian: 2 tiếng (1 canh giờ Tứ Trị)
        const stepMs = 2 * 3600 * 1000;
        let currTime = startDt.getTime();
        const endMs = endDt.getTime();
        let loopLimit = 0;

        while (currTime <= endMs && loopLimit < 120) {
            const checkDate = new Date(currTime);
            const tuTri = getTuTriFromCore(checkDate);
            loopLimit++;

            allQueList.forEach(que => {
                const cases = que.possibleDongCases || [que];
                cases.forEach(queCase => {
                    let haoList = queCase.haoList || [];
                    let lucThanHao = haoList.find(h => h.lucThan === targetLucThan);
                    let theHao = haoList.find(h => h.isThe);
                    let dongList = haoList.filter(h => h.isDong);

                    if (!lucThanHao || !theHao) return;

                    // Gọi m02-m08 đánh giá điểm
                    const evalLucThan = evaluateHaoWithCore(lucThanHao, tuTri);
                    const evalThe = evaluateHaoWithCore(theHao, tuTri);

                    // TIÊU CHÍ 1: Dụng Thần & Thế Hào bắt buộc >= Medium (3.0)
                    if (!evalLucThan.isOk || !evalThe.isOk) return;

                    // TIÊU CHÍ 2: Lọc Quan Quỷ (Cát thần / Hung thần)
                    if (targetLucThan === "Quan Quỷ") {
                        if (quanQuyOpt === "CAT_THAN" && lucThanHao.lucThanName === "Bạch Hổ") return;
                        if (quanQuyOpt === "HUNG_THAN") {
                            if (lucThanHao.isDong || lucThanHao.lucThanName !== "Thanh Long") return;
                        }
                    }

                    // TIÊU CHÍ 3: Bảo vệ Thế hào - Loại bỏ nếu Bạch Hổ phát động
                    let hasBachHoRisk = haoList.some(h => h.isDong && h.lucThanName === "Bạch Hổ");
                    if (hasBachHoRisk) return;

                    // THỎA MÃN TẤT CẢ TIÊU CHÍ -> ĐẶT VÀO KẾT QUẢ
                    results.push({
                        timeStr: checkDate.toLocaleString('vi-VN'),
                        tuTri: tuTri,
                        tenQue: queCase.tenQue || que.tenQue,
                        haoDongText: dongList.map(h => h.index).join(", ") || "Quẻ Tĩnh",
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
     * 4. GIAO DIỆN TƯƠNG TÁC UI
     */
    function renderUI() {
        if (document.getElementById("m09-container")) return;

        const now = new Date();
        const startIso = now.toISOString().slice(0, 16);
        const endIso = new Date(now.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 16);

        const container = document.createElement("div");
        container.id = "m09-container";
        container.style.cssText = "margin: 20px auto; padding: 15px; max-width: 800px; background: #fff8e7; border: 2px solid #8b0000; border-radius: 8px; font-family: sans-serif;";

        container.innerHTML = `
            <h3 style="color:#8b0000; text-align:center; margin-top:0; border-bottom: 1px solid #d4af37; padding-bottom:8px;">
                MODULE M09: TÌM QUẺ CHIẾN LƯỢC (GATEKEEPER ENGINE)
            </h3>
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <div style="flex:1;">
                    <label><b>Thời gian A (Bắt đầu):</b></label>
                    <input type="datetime-local" id="m09-time-a" value="${startIso}" style="width:100%; padding:6px; box-sizing:border-box;"/>
                </div>
                <div style="flex:1;">
                    <label><b>Thời gian B (Kết thúc):</b></label>
                    <input type="datetime-local" id="m09-time-b" value="${endIso}" style="width:100%; padding:6px; box-sizing:border-box;"/>
                </div>
            </div>
            <div style="margin-bottom:15px;">
                <label><b>Chọn Lục Thân Dụng Thần:</b></label>
                <select id="m09-select-luc-than" style="width:100%; padding:6px;">
                    <option value="Thê Tài">Thê Tài (Cầu Tài, Hôn Nhân Nữ)</option>
                    <option value="Phụ Mẫu">Phụ Mẫu (Giấy Tờ, Học Hành, Nhà Cửa)</option>
                    <option value="Huynh Đệ">Huynh Đệ (Đối Tác, Cạnh Tranh)</option>
                    <option value="Tử Tôn">Tử Tôn (May Mắn, Con Cái, Giải Tai)</option>
                    <option value="Quan Quỷ">Quan Quỷ (Công Danh, Chức Vụ)</option>
                </select>
            </div>
            <div style="text-align:center; margin-bottom:15px;">
                <button id="m09-btn-exec" style="background:#8b0000; color:#fff; font-weight:bold; border:none; padding:10px 20px; border-radius:4px; cursor:pointer;">
                    QUÉT T TỨ TRỊ (A &rarr; B) & LỌC QUẺ
                </button>
            </div>
            <div id="m09-output-box" style="background:#fff; padding:10px; border:1px solid #ccc; max-height:400px; overflow-y:auto;">
                <p style="text-align:center; color:#666;">Chọn mốc thời gian A &rarr; B và bấm nút để xem danh sách quẻ đạt chuẩn.</p>
            </div>
        `;

        document.body.appendChild(container);

        document.getElementById("m09-btn-exec").addEventListener("click", function () {
            const outBox = document.getElementById("m09-output-box");
            outBox.innerHTML = "<p style='text-align:center; color:orange;'><b>Đang duyệt vòng lặp Tứ Trị thời gian A -> B và đối chiếu với m01-m08...</b></p>";

            setTimeout(() => {
                const list = runSearchEngine({
                    startTime: document.getElementById("m09-time-a").value,
                    endTime: document.getElementById("m09-time-b").value,
                    targetLucThan: document.getElementById("m09-select-luc-than").value
                });

                if (list.length === 0) {
                    outBox.innerHTML = "<p style='color:red; text-align:center;'>Không tìm thấy quẻ nào thỏa mãn toàn bộ tiêu chí bảo vệ Thế và Dụng Thân đạt Medium trong khoảng thời gian này.</p>";
                    return;
                }

                let html = `<p style='color:green; font-weight:bold;'>Đã tìm thấy ${list.length} quẻ đạt yêu cầu chuẩn Cổ Pháp:</p><ol style='padding-left:20px;'>`;
                list.forEach(item => {
                    html += `
                        <li style="margin-bottom:8px; border-bottom:1px dashed #eee; padding-bottom:5px;">
                            <b>[${item.timeStr}]</b> - Tứ Trị: ${item.tuTri.namCanChi} / ${item.tuTri.thangCanChi} / ${item.tuTri.ngayCanChi} / ${item.tuTri.gioCanChi}<br/>
                            <b>Quẻ: ${item.tenQue}</b> (Hào động: ${item.haoDongText})<br/>
                            <small>&rarr; Dụng Thần: ${item.lucThanEval.desc} | Hào Thế: ${item.theEval.desc}</small>
                        </li>
                    `;
                });
                html += "</ol>";
                outBox.innerHTML = html;
            }, 50);
        });
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(renderUI, 300);
    } else {
        document.addEventListener("DOMContentLoaded", renderUI);
    }

    return {
        runSearchEngine: runSearchEngine,
        getTuTriFromCore: getTuTriFromCore
    };
})();
