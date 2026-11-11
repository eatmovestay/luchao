/**
 * Module Chiến Lược & Tìm Quẻ Ngũ Linh / Lục Hào Cổ Pháp (mchienluoc.js)
 * Đã tích hợp tự động tra cứu Tứ Trị từ calendar-core.js và kế thừa logic m01-m08.
 */

const StrategyFinderModule = (function () {

    // Thang điểm định lượng năng lượng hào
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
     * 1. Hàm tra cứu Tứ Trị từ calendar-core.js
     */
    function getTuTriFromCalendar(dateObj) {
        if (typeof CalendarCore !== 'undefined' && CalendarCore.NL_getDayContext) {
            const ctx = CalendarCore.NL_getDayContext(dateObj);
            return {
                gioCanChi: ctx.gioCanChi,
                ngayCanChi: ctx.ngayCanChi,
                thangCanChi: ctx.thangCanChi,
                namCanChi: ctx.namCanChi,
                tietKhi: ctx.tietKhi,
                rawCtx: ctx
            };
        } else {
            // Fallback nếu gọi độc lập
            console.warn("CalendarCore chưa tải, sử dụng dữ liệu Tứ Trị mặc định.");
            return null;
        }
    }

    /**
     * 2. Đánh giá Định lượng trạng thái đơn lẻ của Hào so với Tứ Trị (Định lượng 1 -> 5)
     */
    function evaluateHaoStatusWithTuTri(hao, tuTri) {
        if (!hao) return { score: 0, level: 'RONG', desc: 'Không có hào' };

        let score = SCORE_LEVELS.MEDIUM;
        let logs = [];

        // Lấy thông tin Vượng Suy theo Mùa / Nguyệt Lệnh & Nhật Thần (Logic m02/m05)
        if (typeof ModuleM02 !== 'undefined' && ModuleM02.calcVuangSuy) {
            const vsResult = ModuleM02.calcVuangSuy(hao, tuTri);
            score = vsResult.score;
            logs.push(vsResult.desc);
        } else {
            // Logic tính nhanh chuẩn Cổ Pháp
            if (hao.isNguyetTruc || hao.isNhatTruc) {
                score = SCORE_LEVELS.VUONG;
                logs.push("Lâm/Trực Nhật Nguyệt");
            } else if (hao.isNguyetSinh || hao.isNhatSinh) {
                score = SCORE_LEVELS.MEDIUM_PLUS;
                logs.push("Được Nhật/Nguyệt sinh");
            } else if (hao.isNguyetPha) {
                score = SCORE_LEVELS.TUYET_MO_PHA;
                logs.push("Nguyệt Phá (Giả/Thực phá)");
            } else if (hao.isNhatMo || hao.isNguyetMo) {
                score = SCORE_LEVELS.SUY;
                logs.push("Lâm Mộ tại Tứ Trị");
            }
        }

        const isMediumOrAbove = score >= SCORE_LEVELS.MEDIUM;
        return {
            score: score,
            isOk: isMediumOrAbove,
            statusLabel: isMediumOrAbove ? "Medium trở lên" : "Dưới Medium (Bất lợi)",
            logs: logs
        };
    }

    /**
     * 3. Phân tích tương tác chéo giữa các Hào (Định lượng 6 -> 9)
     */
    function analyzeCrossInteractions(lucThanHao, theHao, ungHao, dongHaoList, bienHaoList) {
        let results = {
            d6_The_LucThan: { score: 0, text: "" },
            d7_Dong_LucThan: { score: 0, text: "" },
            d8_Bien_LucThan: { score: 0, text: "" },
            d9_Ung_LucThan: { score: 0, text: "" },
            hasRiskForThe: false
        };

        // Định lượng 6: Thế & Lục Thân
        if (theHao.index === lucThanHao.index) {
            results.d6_The_LucThan = {
                score: SCORE_LEVELS.VUONG,
                text: "Lục Thân trùng hào Thế (Vận mệnh là 1 khối, Thế tự hưởng)."
            };
        } else {
            // Tương tác Thế và Lục Thân
            const rel = checkSinhKhacRelation(theHao, lucThanHao);
            results.d6_The_LucThan = { score: rel.score, text: `Thế ${rel.type} Lục Thân` };
            if (rel.isNegativeForThe) results.hasRiskForThe = true;
        }

        // Định lượng 7: Hào Động & Lục Thân
        if (dongHaoList && dongHaoList.length > 0) {
            let dongImpact = checkGroupImpact(dongHaoList, lucThanHao);
            results.d7_Dong_LucThan = dongImpact;
        } else {
            results.d7_Dong_LucThan = { score: SCORE_LEVELS.MEDIUM, text: "Quẻ Tĩnh, không có Hào Động tác động." };
        }

        // Định lượng 8: Hào Biến & Lục Thân
        if (bienHaoList && bienHaoList.length > 0) {
            let bienImpact = checkGroupImpact(bienHaoList, lucThanHao);
            results.d8_Bien_LucThan = bienImpact;
        } else {
            results.d8_Bien_LucThan = { score: SCORE_LEVELS.MEDIUM, text: "Không có Hào Biến tác động." };
        }

        // Định lượng 9: Ứng & Lục Thân (Độ ưu tiên thấp nhất)
        const ungRel = checkSinhKhacRelation(ungHao, lucThanHao);
        results.d9_Ung_LucThan = { score: ungRel.score, text: `Ứng ${ungRel.type} Lục Thân` };

        // Kiểm tra Ứng có tác động xấu lên Thế không
        const ungTheRel = checkSinhKhacRelation(ungHao, theHao);
        if (ungTheRel.isNegativeForThe) {
            results.hasRiskForThe = true;
        }

        return results;
    }

    /**
     * 4. Hàm Kiểm tra mối quan hệ Sinh / Khắc / Tỷ Hòa
     */
    function checkSinhKhacRelation(haoA, haoB) {
        if (!haoA || !haoB) return { score: SCORE_LEVELS.MEDIUM, type: "Bình hòa", isNegativeForThe: false };
        // Giả lập tra cứu Nạp Giáp / Ngũ Hành (sử dụng logic m01)
        const elementA = haoA.nguHanh;
        const elementB = haoB.nguHanh;

        if (elementA === elementB) return { score: SCORE_LEVELS.MEDIUM_PLUS, type: "Tỷ Hòa (Đồng Ngũ Hành)", isNegativeForThe: false };
        
        // Kim sinh Thủy, Thủy sinh Mộc...
        const sinhMap = { 'Kim': 'Thủy', 'Thủy': 'Mộc', 'Mộc': 'Hỏa', 'Hỏa': 'Thổ', 'Thổ': 'Kim' };
        const khacMap = { 'Kim': 'Mộc', 'Mộc': 'Thổ', 'Thổ': 'Thủy', 'Thủy': 'Hỏa', 'Hỏa': 'Kim' };

        if (sinhMap[elementA] === elementB) {
            return { score: SCORE_LEVELS.VUONG, type: "Sinh cho", isNegativeForThe: false };
        }
        if (khacMap[elementA] === elementB) {
            return { score: SCORE_LEVELS.DUOI_MEDIUM, type: "Khắc", isNegativeForThe: true };
        }

        return { score: SCORE_LEVELS.MEDIUM, type: "Bình hòa", isNegativeForThe: false };
    }

    function checkGroupImpact(sourceList, targetHao) {
        let totalScore = SCORE_LEVELS.MEDIUM;
        let descs = [];
        sourceList.forEach(src => {
            let rel = checkSinhKhacRelation(src, targetHao);
            descs.push(`${src.tenHao} (${src.lucThan}) ${rel.type} ${targetHao.tenHao}`);
            if (rel.isNegativeForThe) totalScore = SCORE_LEVELS.DUOI_MEDIUM;
        });
        return { score: totalScore, text: descs.join("; ") };
    }

    /**
     * 5. Hàm Tìm & Bộ Lọc Quẻ Theo Chiến Lược Yêu Cầu (Main API)
     */
    function searchStrategyQue(params) {
        /**
         * params = {
         *   startTime: Date,
         *   endTime: Date,
         *   targetLucThan: "Thê Tài" | "Phụ Mẫu" | "Huynh Đệ" | "Tử Tôn" | "Quan Quỷ",
         *   quanQuyOption: "CAT_THAN" | "HUNG_THAN" (nếu chọn Quan Quỷ)
         * }
         */
        const results = [];
        const tuTri = getTuTriFromCalendar(params.startTime || new Date());

        // Lấy danh sách 64 Quẻ từ module data (m01/m04)
        const allQueList = typeof ModuleM01 !== 'undefined' ? ModuleM01.getAll64Que() : [];

        allQueList.forEach(que => {
            // Duyệt từng biến thể Hào Động của quẻ
            que.possibleDongCases.forEach(queCase => {

                // 1. Kiểm tra Lục Thân được chọn có trong quẻ không
                let lucThanHaoList = queCase.haoList.filter(h => h.lucThan === params.targetLucThan);
                let isPhucThan = false;

                if (lucThanHaoList.length === 0) {
                    isPhucThan = true;
                    // Báo Yêu cầu nhập thủ công / Không tự nhận diện Phục Thần
                }

                // Chọn Hào Lục Thân chính (Ưu tiên trùng Thế, hoặc Hào vượng hơn)
                let lucThanMain = lucThanHaoList.find(h => h.isThe) || lucThanHaoList[0];
                let theHao = queCase.haoList.find(h => h.isThe);
                let ungHao = queCase.haoList.find(h => h.isUng);
                let dongHaoList = queCase.haoList.filter(h => h.isDong);
                let bienHaoList = queCase.bienHaoList || [];

                // Skip nếu không có Lục Thân và là Phục Thần chưa chỉ định
                if (!lucThanMain && isPhucThan) return;

                // 2. Định lượng 1 -> 5 so Tứ Trị
                const d1_LucThan = evaluateHaoStatusWithTuTri(lucThanMain, tuTri);
                const d2_The = evaluateHaoStatusWithTuTri(theHao, tuTri);
                const d3_Ung = evaluateHaoStatusWithTuTri(ungHao, tuTri);

                // 3. Xử lý logic đặc biệt cho Quan Quỷ (Cát Thần vs Hung Thần)
                if (params.targetLucThan === "Quan Quỷ") {
                    if (params.quanQuyOption === "CAT_THAN") {
                        // Không được lâm Bạch Hổ
                        if (lucThanMain.lucThan === "Bạch Hổ" || theHao.lucThan === "Bạch Hổ") return;
                    } else if (params.quanQuyOption === "HUNG_THAN") {
                        // Không được vượng, không được phát động, BẮT BUỘC lâm Thanh Long
                        if (lucThanMain.isDong) return; // Không muốn phát động
                        if (lucThanMain.lucThanName !== "Thanh Long") return; // Cắm cờ loại nếu lâm Lục Thần khác
                        if (d1_LucThan.score > SCORE_LEVELS.HUU) return; // Yêu cầu không có lực/khí
                    }
                }

                // 4. Kiểm tra Bạch Hổ & Hào Động nguy hiểm
                let hasBachHoRisk = queCase.haoList.some(h => (h.isThe || h.isUng || h.isDong) && h.lucThanName === "Bạch Hổ" && h.isDong);
                if (hasBachHoRisk) return; // Loại bỏ nếu có Bạch Hổ phát động nguy hại

                // 5. Định lượng tương tác 6 -> 9
                const crossResult = analyzeCrossInteractions(lucThanMain, theHao, ungHao, dongHaoList, bienHaoList);

                // 6. ĐỒNG BỘ ĐIỀU KIỆN CHỐT VÀO: THẾ HÀO BẮT BUỘC KHÔNG BẤT LỢI (>= MEDIUM)
                if (!d2_The.isOk || crossResult.hasRiskForThe) {
                    // Thế dưới Medium -> ĐÌNH CHỈ!
                    return;
                }

                // Dụng Thần phải từ Medium trở lên
                if (!d1_LucThan.isOk) {
                    return;
                }

                // Nếu thỏa mãn tất cả tiêu chí -> Thêm vào danh sách quẻ đạt
                results.push({
                    queTen: queCase.tenQue,
                    haoDong: dongHaoList.map(h => h.index).join(", ") || "Quẻ Tĩnh",
                    lucThanSelected: params.targetLucThan,
                    isPhucThan: isPhucThan,
                    evaluations: {
                        d1_LucThan: d1_LucThan,
                        d2_The: d2_The,
                        d3_Ung: d3_Ung,
                        cross: crossResult
                    },
                    status: "ĐẠT YÊU CẦU (Từ Medium trở lên)",
                    note: isPhucThan ? "Lục Thân thuộc Phục Thần - Cần xác nhận thủ công" : "Lục Thân hiển thị rõ trên quẻ"
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
