/**
 * Module Chiến Lược & Tìm Quẻ Ngũ Linh / Lục Hào Cổ Pháp (m09.js)
 * Tự động tra cứu Tứ Trị từ calendar-core.js và kế thừa logic m01-m08.
 */

const StrategyFinderModule = (function () {

    // Thang điểm định lượng năng lượng hào chuẩn Cổ Pháp
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
     * 1. Tra cứu Tứ Trị từ calendar-core.js (Hỗ trợ cả 2 chuẩn gọi)
     */
    function getTuTriFromCalendar(dateObj) {
        let ctx = null;
        if (typeof CalendarCore !== 'undefined' && CalendarCore.NL_getDayContext) {
            ctx = CalendarCore.NL_getDayContext(dateObj);
        } else if (typeof NL_getDayContext === 'function') {
            ctx = NL_getDayContext(dateObj);
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

        // Fallback an toàn nếu chưa nạp kịp calendar-core
        return {
            gioCanChi: "Quý Dậu",
            ngayCanChi: "Kỷ Sửu",
            thangCanChi: "Kỷ Hợi",
            namCanChi: "Bính Ngọ",
            tietKhi: "Tiểu Tuyết"
        };
    }

    /**
     * 2. Đánh giá trạng thái Hào so với Tứ Trị (Định lượng 1 -> 5)
     */
    function evaluateHaoStatusWithTuTri(hao, tuTri) {
        if (!hao) return { score: 0, isOk: false, statusLabel: 'Không có hào', logs: [] };

        let score = SCORE_LEVELS.MEDIUM;
        let logs = [];

        // Kế thừa logic m02 nếu có
        if (typeof ModuleM02 !== 'undefined' && ModuleM02.calcVuangSuy) {
            const vsResult = ModuleM02.calcVuangSuy(hao, tuTri);
            score = vsResult.score;
            logs.push(vsResult.desc);
        } else {
            // Logic Cổ Pháp chuẩn
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

        // Định lượng 6: Thế & Lục Thân
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

        // Định lượng 7 & 8: Động / Biến tác động Lục Thân
        if (dongHaoList && dongHaoList.length > 0) {
            results.d7_Dong_LucThan = checkGroupImpact(dongHaoList, lucThanHao);
        }
        if (bienHaoList && bienHaoList.length > 0) {
            results.d8_Bien_LucThan = checkGroupImpact(bienHaoList, lucThanHao);
        }

        // Định lượng 9: Ứng & Lục Thân (Mức ưu tiên thấp nhất)
        const ungRel = checkSinhKhacRelation(ungHao, lucThanHao);
        results.d9_Ung_LucThan = { score: ungRel.score, text: `Ứng ${ungRel.type} Lục Thân` };

        // Kiểm tra Ứng có hại Thế không
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
     * 4. API Main Tìm Quẻ Chiến Lược
     */
    function searchStrategyQue(params) {
        const results = [];
        const tuTri = getTuTriFromCalendar(params ? params.startTime : new Date());
        const targetLucThan = params ? params.targetLucThan : "Thê Tài";
        const quanQuyOption = params ? params.quanQuyOption : "CAT_THAN";

        const allQueList = typeof ModuleM01 !== 'undefined' && ModuleM01.getAll64Que ? ModuleM01.getAll64Que() : [];

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

                // Logic lọc Quan Quỷ
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

                // LỤC THÂN PHẢI >= MEDIUM
                if (!d1_LucThan.isOk) return;

                results.push({
                    queTen: queCase.tenQue,
                    haoDong: dongHaoList.map(h => h.index).join(", ") || "Quẻ Tĩnh",
                    lucThanSelected: targetLucThan,
                    isPhucThan: isPhucThan,
                    evaluations: { d1_LucThan, d2_The, d3_Ung, cross: crossResult },
                    status: "ĐẠT YÊU CẦU"
                });
            });
        });

        return results;
    }

    return {
        searchStrategyQue: searchStrategyQue,
        getTuTriFromCalendar: getTuTriFromCalendar
    };
})();
