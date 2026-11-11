/**
 * Module Chiến Lược & Tìm Quẻ Ngũ Linh / Lục Hào Cổ Pháp (m09.js)
 * Tích hợp tự động tra cứu Tứ Trị từ calendar-core.js, kế thừa logic m01-m08
 * VÀ ĐÃ ĐƯỢC LẮP BỘ LINH KIỆN: DUYỆT TỨ TRỊ THEO KHOẢNG THỜI GIAN A -> B.
 */

window.StrategyFinderModule = (function () {

    const SCORE_LEVELS = {
        CUC_VUONG: 5,
        VUONG: 4,
        MEDIUM_PLUS: 3.5,
        MEDIUM: 3,         // Ngưỡng tối thiểu đạt yêu cầu
        HUU: 2,
        SUY: 1.5,
        VO_CAN: 1,
        DUOI_MEDIUM: 1,    // Ngưỡng bị đình chỉ / loại
        TUYET_MO_PHA: 0
    };

    /**
     * 1. Tra cứu Tứ Trị tự động từ calendar-core.js theo Dương Lịch
     */
    function getTuTriFromCalendar(dateObj) {
        let ctx = null;
        try {
            if (typeof CalendarCore !== 'undefined' && CalendarCore.NL_getDayContext) {
                ctx = CalendarCore.NL_getDayContext(dateObj);
            } else if (typeof NL_getDayContext === 'function') {
                ctx = NL_getDayContext(dateObj);
            } else if (window.CalendarCore && window.CalendarCore.NL_getDayContext) {
                ctx = window.CalendarCore.NL_getDayContext(dateObj);
            }
        } catch (e) {
            console.warn("m09.js: Chưa lấy được context từ CalendarCore", e);
        }

        if (ctx) {
            return {
                gioCanChi: ctx.gioCanChi || "",
                ngayCanChi: ctx.ngayCanChi || "",
                thangCanChi: ctx.thangCanChi || "",
                namCanChi: ctx.namCanChi || "",
                tietKhi: ctx.tietKhi || "",
                rawCtx: ctx
            };
        }

        return {
            gioCanChi: "Quý Dậu",
            ngayCanChi: "Kỷ Sửu",
            thangCanChi: "Kỷ Hợi",
            namCanChi: "Bính Ngọ",
            tietKhi: "Tiểu Tuyết"
        };
    }

    /**
     * 2. Đánh giá trạng thái Hào so với Tứ Trị (Định lượng 1 -> 5) kế thừa từ m02/Cổ Pháp
     */
    function evaluateHaoStatusWithTuTri(hao, tuTri) {
        if (!hao) return { score: 0, isOk: false, statusLabel: 'Không có hào', logs: [] };

        let score = SCORE_LEVELS.MEDIUM;
        let logs = [];

        try {
            if (typeof ModuleM02 !== 'undefined' && ModuleM02.calcVuangSuy) {
                const vsResult = ModuleM02.calcVuangSuy(hao, tuTri);
                score = vsResult.score;
                logs.push(vsResult.desc);
            } else {
                if (hao.isNguyetTruc || hao.isNhatTruc) {
                    score = SCORE_LEVELS.VUONG;
                    logs.push("Lâm/Trực Nhật Nguyệt");
                } else if (hao.isNguyetSinh || hao.isNhatSinh) {
                    score = SCORE_LEVELS.MEDIUM_PLUS;
                    logs.push("Được Nhật/Nguyệt sinh");
                } else if (hao.isNguyetPha) {
                    score = SCORE_LEVELS.TUYET_MO_PHA;
                    logs.push("Nguyệt Phá");
                } else if (hao.isNhatMo || hao.isNguyetMo) {
                    score = SCORE_LEVELS.SUY;
                    logs.push("Nhập Mộ tại Tứ Trị");
                }
            }
        } catch (err) {
            score = SCORE_LEVELS.MEDIUM;
        }

        const isOk = score >= SCORE_LEVELS.MEDIUM;
        return {
            score: score,
            isOk: isOk,
            statusLabel: isOk ? "Medium trở lên (Đạt)" : "Dưới Medium (Loại)",
            logs: logs
        };
    }

    /**
     * 3. Phân tích tương tác chéo (Định lượng 6 -> 9)
     */
    function analyzeCrossInteractions(lucThanHao, theHao, ungHao, dongHaoList, bienHaoList) {
        let results = {
            d6_The_LucThan: { score: SCORE_LEVELS.MEDIUM, text: "" },
            d7_Dong_LucThan: { score: SCORE_LEVELS.MEDIUM, text: "" },
            d8_Bien_LucThan: { score: SCORE_LEVELS.MEDIUM, text: "" },
            d9_Ung_LucThan: { score: SCORE_LEVELS.MEDIUM, text: "" },
            hasRiskForThe: false
        };

        if (theHao && lucThanHao && theHao.index === lucThanHao.index) {
            results.d6_The_LucThan = {
                score: SCORE_LEVELS.VUONG,
                text: "Lục Thân trùng hào Thế (Vận mệnh là 1 khối, Thế tự hưởng)."
            };
        } else {
            const rel = checkSinhKhacRelation(theHao, lucThanHao);
            results.d6_The_LucThan = { score: rel.score, text: `Thế ${rel.type} Lục Thân` };
            if (rel.isNegativeForThe) results.hasRiskForThe = true;
        }

        if (dongHaoList && dongHaoList.length > 0) {
            results.d7_Dong_LucThan = checkGroupImpact(dongHaoList, lucThanHao);
        }
        if (bienHaoList && bienHaoList.length > 0) {
            results.d8_Bien_LucThan = checkGroupImpact(bienHaoList, lucThanHao);
        }

        const ungRel = checkSinhKhacRelation(ungHao, lucThanHao);
        results.d9_Ung_LucThan = { score: ungRel.score, text: `Ứng ${ungRel.type} Lục Thân` };

        const ungTheRel = checkSinhKhacRelation(ungHao, theHao);
        if (ungTheRel.isNegativeForThe) results.hasRiskForThe = true;

        return results;
    }

    function checkSinhKhacRelation(haoA, haoB) {
        if (!haoA || !haoB) return { score: SCORE_LEVELS.MEDIUM, type: "Bình hòa", isNegativeForThe: false };
        const elemA = haoA.nguHanh || "";
        const elemB = haoB.nguHanh || "";

        if (elemA === elemB) return { score: SCORE_LEVELS.MEDIUM_PLUS, type: "Tỷ Hòa", isNegativeForThe: false };

        const sinhMap = { 'Kim': 'Thủy', 'Thủy': 'Mộc', 'Mộc': 'Hỏa', 'Hỏa': 'Thổ', 'Thổ': 'Kim' };
        const khacMap = { 'Kim': 'Mộc', 'Mộc': 'Thổ', 'Thổ': 'Thủy', 'Thủy': 'Hỏa', 'Hỏa': 'Kim' };

        if (sinhMap[elemA] === elemB) return { score: SCORE_LEVELS.VUONG, type: "Sinh cho", isNegativeForThe: false };
        if (khacMap[elemA] === elemB) return { score: SCORE_LEVELS.DUOI_MEDIUM, type: "Khắc", isNegativeForThe: true };

        return { score: SCORE_LEVELS.MEDIUM, type: "Bình hòa", isNegativeForThe: false };
    }

    function checkGroupImpact(sourceList, targetHao) {
        let totalScore = SCORE_LEVELS.MEDIUM;
        let descs = [];
        sourceList.forEach(src => {
            let rel = checkSinhKhacRelation(src, targetHao);
            descs.push(`${src.tenHao || 'Hào'} ${rel.type} Lục Thân`);
            if (rel.isNegativeForThe) totalScore = SCORE_LEVELS.DUOI_MEDIUM;
        });
        return { score: totalScore, text: descs.join("; ") };
    }

    /**
     * 4. ENGINE LINH KIỆN CỐT LÕI: DUYỆT VÒNG LẶP THỜI GIAN A -> B x 64 QUẺ x 384 HÀO
     */
    function searchStrategyQue(params) {
        const results = [];
        const startDt = params && params.startTime ? new Date(params.startTime) : new Date();
        const endDt = params && params.endTime ? new Date(params.endTime) : new Date(startDt.getTime() + 24 * 3600 * 1000);
        const targetLucThan = params ? params.targetLucThan : "Thê Tài";
        const quanQuyOption = params ? params.quanQuyOption : "CAT_THAN";

        let allQueList = [];
        if (typeof ModuleM01 !== 'undefined' && ModuleM01.getAll64Que) {
            allQueList = ModuleM01.getAll64Que();
        } else if (window.ModuleM01 && window.ModuleM01.getAll64Que) {
            allQueList = window.ModuleM01.getAll64Que();
        }

        // Bước nhảy thời gian: Nhảy từng canh giờ (2 tiếng) để quét hết Tứ Trị
        const timeStepMs = 2 * 3600 * 1000;
        let currentTime = startDt.getTime();
        const endTimeMs = endDt.getTime();

        let countMoc = 0;
        // Giới hạn 100 mốc quét để đảm bảo tốc độ trên smartphone
        while (currentTime <= endTimeMs && countMoc < 100) {
            const checkDate = new Date(currentTime);
            const tuTri = getTuTriFromCalendar(checkDate);
            countMoc++;

            allQueList.forEach(que => {
                if (!que.possibleDongCases) return;
                que.possibleDongCases.forEach(queCase => {
                    let lucThanHaoList = queCase.haoList.filter(h => h.lucThan === targetLucThan);
                    let isPhucThan = lucThanHaoList.length === 0;

                    let lucThanMain = lucThanHaoList.find(h => h.isThe) || lucThanHaoList[0];
                    let theHao = queCase.haoList.find(h => h.isThe);
                    let ungHao = queCase.haoList.find(h => h.isUng);
                    let dongHaoList = queCase.haoList.filter(h => h.isDong);
                    let bienHaoList = queCase.bienHaoList || [];

                    if (!lucThanMain && isPhucThan) return;

                    const d1_LucThan = evaluateHaoStatusWithTuTri(lucThanMain, tuTri);
                    const d2_The = evaluateHaoStatusWithTuTri(theHao, tuTri);
                    const d3_Ung = evaluateHaoStatusWithTuTri(ungHao, tuTri);

                    // Logic lọc Quan Quỷ (Cát thần / Hung thần)
                    if (targetLucThan === "Quan Quỷ") {
                        if (quanQuyOption === "CAT_THAN") {
                            if (lucThanMain && lucThanMain.lucThanName === "Bạch Hổ") return;
                        } else if (quanQuyOption === "HUNG_THAN") {
                            if (lucThanMain && lucThanMain.isDong) return;
                            if (lucThanMain && lucThanMain.lucThanName !== "Thanh Long") return;
                            if (d1_LucThan.score > SCORE_LEVELS.HUU) return;
                        }
                    }

                    // Lọc Bạch Hổ phát động
                    let hasBachHoRisk = queCase.haoList.some(h => (h.isThe || h.isUng || h.isDong) && h.lucThanName === "Bạch Hổ" && h.isDong);
                    if (hasBachHoRisk) return;

                    const crossResult = analyzeCrossInteractions(lucThanMain, theHao, ungHao, dongHaoList, bienHaoList);

                    // THẾ HÀO BẮT BUỘC KHÔNG BẤT LỢI (>= MEDIUM)
                    if (!d2_The.isOk || crossResult.hasRiskForThe) return;

                    // LỤC THÂN DỤNG THẦN PHẢI >= MEDIUM
                    if (!d1_LucThan.isOk) return;

                    results.push({
                        timeMoc: checkDate.toLocaleString('vi-VN'),
                        tuTriInfo: tuTri,
                        queTen: queCase.tenQue,
                        haoDong: dongHaoList.map(h => h.index).join(", ") || "Quẻ Tĩnh",
                        lucThanSelected: targetLucThan,
                        isPhucThan: isPhucThan,
                        evaluations: { d1_LucThan, d2_The, d3_Ung, cross: crossResult },
                        status: "ĐẠT YÊU CẦU"
                    });
                });
            });

            currentTime += timeStepMs;
        }

        return results;
    }

    /**
     * 5. GIAO DIỆN TƯƠNG TÁC FORM NHẬP TIME A -> B
     */
    function renderStrategyUI() {
        if (document.getElementById("m09-strategy-container")) return;

        const now = new Date();
        const defaultStart = now.toISOString().slice(0, 16);
        const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const defaultEnd = nextDay.toISOString().slice(0, 16);

        const container = document.createElement("div");
        container.id = "m09-strategy-container";
        container.style.cssText = `
            margin: 20px auto;
            padding: 15px;
            max-width: 850px;
            background: #fff8e7;
            border: 2px solid #d4af37;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        `;

        container.innerHTML = `
            <h3 style="color: #8b0000; text-align: center; margin-top: 0; border-bottom: 1px solid #d4af37; padding-bottom: 8px;">
                MODULE STRATEGY - TÌM QUẺ THEO MỐC THỜI GIAN A &rarr; B & LỤC THÂN
            </h3>
            
            <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px; background: #fff; padding: 10px; border-radius: 5px; border: 1px solid #eee;">
                <div style="flex: 1; min-width: 240px;">
                    <label style="font-weight: bold; color: #333; display: block; margin-bottom: 4px;">Mốc Thời Gian A (Bắt đầu):</label>
                    <input type="datetime-local" id="m09-time-a" value="${defaultStart}" style="width: 100%; padding: 6px; box-sizing: border-box;" />
                </div>
                <div style="flex: 1; min-width: 240px;">
                    <label style="font-weight: bold; color: #333; display: block; margin-bottom: 4px;">Mốc Thời Gian B (Kết thúc):</label>
                    <input type="datetime-local" id="m09-time-b" value="${defaultEnd}" style="width: 100%; padding: 6px; box-sizing: border-box;" />
                </div>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 15px; align-items: center;">
                <div style="flex: 1; min-width: 260px;">
                    <label style="font-weight: bold; display: block; margin-bottom: 4px;">Chọn Lục Thân Dụng Thần:</label>
                    <select id="m09-luc-than-select" style="width: 100%; padding: 6px; font-size: 14px;">
                        <option value="Thê Tài">Thê Tài (Cầu tài, hôn nhân nữ)</option>
                        <option value="Phụ Mẫu">Phụ Mẫu (Giấy tờ, nhà cửa, học hành)</option>
                        <option value="Huynh Đệ">Huynh Đệ (Bạn bè, đối tác, cạnh tranh)</option>
                        <option value="Tử Tôn">Tử Tôn (Con cái, giải tai, may mắn)</option>
                        <option value="Quan Quỷ">Quan Quỷ (Công danh, tai họa, bệnh tật)</option>
                    </select>
                </div>

                <div id="m09-quan-quy-box" style="display: none; flex: 1; min-width: 260px;">
                    <label style="font-weight: bold; color: #b22222; display: block; margin-bottom: 4px;">Lựa Chọn Quan Quỷ:</label>
                    <select id="m09-quan-quy-opt" style="width: 100%; padding: 6px; font-size: 14px;">
                        <option value="CAT_THAN">Quan Quỷ là Cát Thần (Cầu danh / Không Bạch Hổ)</option>
                        <option value="HUNG_THAN">Quan Quỷ là Hung Thần (Bắt buộc Thanh Long & Tĩnh)</option>
                    </select>
                </div>
            </div>

            <div style="text-align: center; margin-bottom: 15px;">
                <button id="m09-btn-search" style="padding: 10px 25px; background: #8b0000; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 15px;">
                    TÌM QUẺ ĐẠT YÊU CẦU (A &rarr; B)
                </button>
            </div>

            <div id="m09-result-box" style="background: #ffffff; padding: 12px; border: 1px solid #ccc; border-radius: 4px; min-height: 120px; max-height: 450px; overflow-y: auto;">
                <p style="color: #666; text-align: center;">Vui lòng chọn mốc thời gian A &rarr; B, chọn Lục Thân và bấm "TÌM QUẺ ĐẠT YÊU CẦU".</p>
            </div>
        `;

        document.body.appendChild(container);

        const lucThanSelect = document.getElementById("m09-luc-than-select");
        const quanQuyBox = document.getElementById("m09-quan-quy-box");
        lucThanSelect.addEventListener("change", function () {
            quanQuyBox.style.display = this.value === "Quan Quỷ" ? "block" : "none";
        });

        document.getElementById("m09-btn-search").addEventListener("click", function () {
            const timeAVal = document.getElementById("m09-time-a").value;
            const timeBVal = document.getElementById("m09-time-b").value;
            const selectedLucThan = lucThanSelect.value;
            const quanQuyOpt = document.getElementById("m09-quan-quy-opt").value;
            const resultBox = document.getElementById("m09-result-box");

            if (!timeAVal || !timeBVal) {
                alert("Vui lòng chọn đủ mốc thời gian A và B!");
                return;
            }

            resultBox.innerHTML = "<p style='color: #d4af37; font-weight: bold; text-align: center;'>Đang chạy vòng lặp duyệt Tứ Trị thời gian A -> B từ calendar-core.js và quét 64 quẻ (384 hào)...</p>";

            setTimeout(() => {
                const results = searchStrategyQue({
                    startTime: timeAVal,
                    endTime: timeBVal,
                    targetLucThan: selectedLucThan,
                    quanQuyOption: quanQuyOpt
                });

                if (results.length === 0) {
                    resultBox.innerHTML = `<p style="color: red; font-weight: bold; text-align: center;">Không tìm thấy quẻ nào thỏa mãn tiêu chí (Thế & Dụng Thân phải đạt từ Medium trở lên trong toàn bộ các mốc Tứ Trị thuộc khoảng thời gian này).</p>`;
                    return;
                }

                let html = `<p style="color: green; font-weight: bold;">Tìm thấy ${results.length} trường hợp quẻ đạt yêu cầu (Thế hào &ge; Medium, Dụng thân &ge; Medium):</p><ol style="padding-left: 20px;">`;

                results.forEach(item => {
                    const tt = item.tuTriInfo;
                    html += `
                        <li style="margin-bottom: 12px; border-bottom: 1px dashed #ccc; padding-bottom: 8px;">
                            <div style="background: #eef9ff; padding: 4px 8px; border-radius: 4px; font-size: 13px; margin-bottom: 4px;">
                                <strong>Mốc thời gian:</strong> ${item.timeMoc} | <strong>Tứ Trị:</strong> Năm ${tt.namCanChi} - Tháng ${tt.thangCanChi} - Ngày ${tt.ngayCanChi} - Giờ ${tt.gioCanChi}
                            </div>
                            <strong>Quẻ: ${item.queTen}</strong> - Hào Động: <span style="color: blue;">${item.haoDong}</span> 
                            <br/><small>- Dụng Thần (${item.lucThanSelected}): <strong>${item.evaluations.d1_LucThan.statusLabel}</strong> | Hào Thế: <strong>${item.evaluations.d2_The.statusLabel}</strong></small>
                            <br/><small>- Đánh giá Tương tác: ${item.evaluations.cross.d6_The_LucThan.text}</small>
                        </li>
                    `;
                });
                html += `</ol>`;
                resultBox.innerHTML = html;
            }, 100);
        });
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(renderStrategyUI, 500);
    } else {
        document.addEventListener("DOMContentLoaded", renderStrategyUI);
    }

    return {
        searchStrategyQue: searchStrategyQue,
        getTuTriFromCalendar: getTuTriFromCalendar,
        renderStrategyUI: renderStrategyUI
    };
})();
