/* ============================================================================
   m07.js — MODULE: LỤC THÂN THẬT / GIẢ
   ----------------------------------------------------------------------------
   Khe cắm thứ 7 trong dãy module (mchienluoc.js, m01.js..m06.js đã chạy ổn
   định trước đó; m08.js..m60.js sẽ load sau).

   LẤY DATA TỪ ĐÂU (khớp với file nền total.html):
         - Toàn bộ các <script> trong trang (script nền + mchienluoc.js + m01..m06
           + m07.js này + m08..m60.js) đều là "classic script" nạp theo thứ tự,
           chạy chung một global scope của trang — nên các biến/hàm được khai báo
           ở script nền (dataDich, selectedDong, bienQueGiam, tinhLucThan,
           getChiHanh, getHanh, moduleSlot...) đã sẵn sàng và truy cập trực tiếp
           được từ m07.js (cùng cách m01..m06.js chắc hẳn đang làm).
         - Quẻ Chính hiện tại luôn đọc trực tiếp từ 2 dropdown #selectCung /
           #selectQue của form nền + biến selectedDong (hào động) — không tự giữ
           bản sao riêng, để luôn đồng bộ dù người dùng đổi quẻ ở form nền.

   LẤY DATA TỪ mchienluoc.js / m01.js..m06.js:
         Không có source các file này trong lần tạo m07.js này nên KHÔNG thể biết
         chúng có expose thêm biến/hàm global nào khác ngoài các biến đã thấy ở
         file nền hay không. m07.js chỉ dùng những gì chắc chắn có (dataDich,
         selectedDong, bienQueGiam, moduleSlot). Nếu m01-m06 có expose thêm state
         dùng chung (vd Nhật/Nguyệt/Tuần Không đã nhập ở module khác) thì có thể
         bổ sung đọc thêm sau khi biết tên biến chính xác.

   ĐƯA DATA RA CHO m08.js..m60.js DÙNG:
         - window.M07_LucThanThatGia : object kết quả lần xử lý gần nhất.
         - window.getM07Result()         : hàm trả về object trên (null nếu chưa chạy).
         Các module sau chỉ cần gọi getM07Result() để lấy lại kết quả mà không
         cần chạy lại thuật toán.
   ============================================================================ */

(function () {
  "use strict";

  /* ---------------- 1. BẢNG DỮ LIỆU LỤC THÂN ---------------- */

  var LUC_THAN_LIST = ["Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ"];

  // Vòng SINH (mỗi phần tử sinh ra phần tử kế tiếp, tuần hoàn):
  // Phụ Mẫu sinh Huynh Đệ sinh Tử Tôn sinh Thê Tài sinh Quan Quỷ sinh Phụ Mẫu
  var SINH_ORDER = ["Phụ Mẫu", "Huynh Đệ", "Tử Tôn", "Thê Tài", "Quan Quỷ"];

  // Vòng KHẮC (mỗi phần tử khắc phần tử kế tiếp, tuần hoàn):
  // Quan Quỷ khắc Huynh Đệ khắc Thê Tài khắc Phụ Mẫu khắc Tử Tôn khắc Quan Quỷ
  var KHAC_ORDER = ["Quan Quỷ", "Huynh Đệ", "Thê Tài", "Phụ Mẫu", "Tử Tôn"];

  function sinhNext(x) {
        // trả về lục thân mà x sinh ra (vai "con" nếu x là Thế)
        var i = SINH_ORDER.indexOf(x);
        return SINH_ORDER[(i + 1) % 5];
  }
  function sinhPrev(x) {
        // trả về lục thân sinh ra x (vai "cha mẹ" nếu x là Thế)
        var i = SINH_ORDER.indexOf(x);
        return SINH_ORDER[(i + 4) % 5];
  }
  function khacNext(x) {
        // trả về lục thân bị x khắc (dùng cho: Thế là Nam, tìm vợ = cái Thế khắc)
        var i = KHAC_ORDER.indexOf(x);
        return KHAC_ORDER[(i + 1) % 5];
  }
  function khacPrev(x) {
        // trả về lục thân khắc x (dùng cho: Thế là Nữ, tìm chồng = cái khắc Thế)
        var i = KHAC_ORDER.indexOf(x);
        return KHAC_ORDER[(i + 4) % 5];
  }

  // Bát quái: chuỗi 3 bit (hào thấp-giữa-cao, "1"=Dương/liền "0"=Âm/đứt)
  // đã đối chiếu khớp với dữ liệu quẻ trong file nền (vd Thiên Phong Cấu
  // c="111110" → Nội quái Tốn="011", Ngoại quái Càn="111").
  var TRIGRAM_TO_CUNGKEY = {
        "111": "Can",  // Càn  (Kiền)
        "110": "Doai", // Đoài
        "101": "Ly",   // Ly
        "100": "Chan", // Chấn
        "011": "Ton",  // Tốn
        "010": "Kham", // Khảm
        "001": "Can2", // Cấn
        "000": "Khon"  // Khôn
  };

  /* ---------------- 2. ĐỌC DATA TỪ FILE NỀN (quẻ Chính hiện tại) ---------------- */

  function m07_getQueChinh() {
        var selCung = document.getElementById("selectCung");
        var selQue = document.getElementById("selectQue");
        if (!selCung || !selQue) return null;
        var cungKey = selCung.value;
        var qName = selQue.value;
        if (!cungKey || !qName || typeof dataDich === "undefined") return null;
        if (!dataDich[cungKey] || !dataDich[cungKey].quẻ[qName]) return null;
        return {
          cungKey: cungKey,
          qName: qName,
          data: dataDich[cungKey].quẻ[qName],
          cung: dataDich[cungKey]
        };
  }

  // Bóc tách 1 chuỗi nạp giáp ("Tử Tôn Mão Mộc (Ứng)") -> { lucThan, chi, hanh, theUng }
  function m07_parseNap(raw) {
        if (!raw) return null;
        var theUng = "";
        if (raw.indexOf("(Thế)") > -1) theUng = "Thế";
        else if (raw.indexOf("(Ứng)") > -1) theUng = "Ứng";
        var clean = raw.replace(/\(Thế\)|\(Ứng\)/g, "").trim();
        var cleanLower = clean.toLowerCase();
        var found = null;
        for (var k = 0; k < LUC_THAN_LIST.length; k++) {
          if (cleanLower.indexOf(LUC_THAN_LIST[k].toLowerCase()) === 0) {
            found = LUC_THAN_LIST[k];
            break;
          }
        }
        if (!found) return null;
        var rest = clean.slice(found.length).trim();
        var parts = rest.split(/\s+/).filter(Boolean);
        return {
          lucThan: found,
          chi: parts[0] || "",
          hanh: parts[1] || "",
          theUng: theUng,
          raw: clean
        };
  }

  // Lấy bit của 1 hào (1..6) từ chuỗi code 6 ký tự của quẻ (giống renderQue: isYang = code[6-haoThu]==="1")
  function m07_bitOfHao(code, haoThu) {
        return code.charAt(6 - haoThu) === "1" ? "1" : "0";
  }

  // Trả về cungKey của trigram Nội quái (hào1,2,3) hoặc Ngoại quái (hào4,5,6) của 1 quẻ theo code
  function m07_trigramCungKey(code, inOrOut) {
        var haoArr = inOrOut === "trong" ? [1, 2, 3] : [4, 5, 6];
        var bits = haoArr.map(function (h) { return m07_bitOfHao(code, h); }).join("");
        return TRIGRAM_TO_CUNGKEY[bits] || null;
  }

  function m07_findThe(data) {
        for (var i = 0; i < 6; i++) {
          var p = m07_parseNap(data.n[i]);
          if (p && p.theUng === "Thế") {
            return { hao: i + 1, lucThan: p.lucThan, chi: p.chi, hanh: p.hanh };
          }
        }
        return null;
  }

  /* ---------------- 3. CASE 1 / CASE 2 / CASE 3 ---------------- */

  function m07_case1(que, target, inOrOut) {
        var trigramCung = m07_trigramCungKey(que.data.c, inOrOut);
        var tenQuai = inOrOut === "trong" ? "Nội" : "Ngoại";
        if (trigramCung !== que.cungKey) {
          var tenTrigram = trigramCung && dataDich[trigramCung] ? dataDich[trigramCung].name : "?";
          return {
            success: false,
            reason: "Quái " + tenQuai + " (" + tenTrigram + ") không trùng Họ Quẻ (" + que.cung.name + ") → Case 1 thất bại."
          };
        }
        var haoArr = inOrOut === "trong" ? [1, 2, 3] : [4, 5, 6];
        for (var k = 0; k < haoArr.length; k++) {
          var h = haoArr[k];
          var p = m07_parseNap(que.data.n[h - 1]);
          if (p && p.lucThan === target) {
            return {
              success: true,
              hao: h,
              lucThan: target,
              chi: p.chi,
              hanh: p.hanh,
              note: "Quái " + tenQuai + " trùng Họ Quẻ (" + que.cung.name + "), có mặt " + target + " tại hào " + h + " (" + p.chi + " " + p.hanh + ")."
            };
          }
        }
        return {
          success: false,
          reason: "Quái " + tenQuai + " trùng Họ Quẻ nhưng không có mặt " + target + " trong quái → Case 1 thất bại."
        };
  }

  // Tìm `target` ở quẻ Thuần đứng đầu Họ Quẻ của `que`, ánh xạ về quẻ Chính làm Phục Thần
  function m07_timQuaPhucThanQueThuan(que, target, inOrOut) {
        var cungData = dataDich[que.cungKey];
        var thuanName = Object.keys(cungData.quẻ)[0];
        var thuanQue = cungData.quẻ[thuanName];
        var haoArr = inOrOut === "trong" ? [1, 2, 3] : [4, 5, 6];
        var tenQuai = inOrOut === "trong" ? "Nội" : "Ngoại";
        for (var k = 0; k < haoArr.length; k++) {
          var h = haoArr[k];
          var p = m07_parseNap(thuanQue.n[h - 1]);
          if (p && p.lucThan === target) {
            var phiThanRaw = que.data.n[h - 1];
            var phiThan = m07_parseNap(phiThanRaw);
            var phiThanTxt = phiThan ? (phiThan.lucThan + " " + phiThan.chi + " " + phiThan.hanh) : phiThanRaw;
            return {
              success: true,
              hao: h,
              lucThan: target,
              chi: p.chi,
              hanh: p.hanh,
              note: "Quẻ Thuần " + thuanName + " (đầu Họ " + que.cung.name + ") có " + target + " " + p.chi + " " + p.hanh +
                    " ở quái " + tenQuai + ", hào " + h + " → ánh xạ về quẻ " + que.qName +
                    " làm Phục Thần dưới hào " + h + " (Phi Thần: " + phiThanTxt + ")."
            };
          }
        }
        return {
          success: false,
          reason: "Quẻ Thuần " + thuanName + " cũng không có " + target + " ở quái " + tenQuai + "."
        };
  }

  // Tính lục thân "target" ứng với 1 quan hệ (so với Thế) theo vòng sinh/khắc
  function m07_tinhLucThanTheoQuanHe(theCategory, quanHe, gioiNguoiHoi, gioiAnhChiEm) {
        var target, formula;
        switch (quanHe) {
          case "ngang-vai":
            target = theCategory;
            formula = "Ngang vai với Thế → giữ nguyên " + theCategory + ".";
            break;
          case "con":
            target = sinhNext(theCategory);
            formula = theCategory + " sinh ra " + target + " (con).";
            break;
          case "chau-noi": {
            var con1 = sinhNext(theCategory);
            target = sinhNext(con1);
            formula = theCategory + " sinh " + con1 + " (con) → " + con1 + " sinh " + target + " (cháu nội).";
            break;
          }
          case "cha-me":
            target = sinhPrev(theCategory);
            formula = target + " sinh ra " + theCategory + " (Thế) → " + target + " là cha mẹ.";
            break;
          case "ong-ba": {
            var cm = sinhPrev(theCategory);
            target = sinhPrev(cm);
            formula = target + " sinh " + cm + " (cha mẹ) → " + cm + " sinh " + theCategory + " (Thế) ⇒ " + target + " là ông bà.";
            break;
          }
          case "vo-chong":
            if (gioiNguoiHoi === "nam") {
              target = khacNext(theCategory);
              formula = "Thế (Nam) = " + theCategory + " khắc " + target + " → " + target + " là vợ.";
            } else {
              target = khacPrev(theCategory);
              formula = target + " khắc Thế (Nữ) = " + theCategory + " → " + target + " là chồng.";
            }
            break;
          case "cha-me-vo-chong": {
            var vc1 = gioiNguoiHoi === "nam" ? khacNext(theCategory) : khacPrev(theCategory);
            target = sinhPrev(vc1);
            formula = "Vợ/chồng = " + vc1 + "; " + target + " sinh ra " + vc1 + " → " + target + " là cha mẹ vợ/chồng.";
            break;
          }
          case "anh-chi-em-vo-chong": {
            var vc2 = gioiNguoiHoi === "nam" ? khacNext(theCategory) : khacPrev(theCategory);
            target = vc2;
            formula = "Vợ/chồng = " + vc2 + "; anh chị em vợ/chồng ngang vai với vợ/chồng → " + target + ".";
            break;
          }
          case "chau-ben-vo-chong": {
            var vc3 = gioiNguoiHoi === "nam" ? khacNext(theCategory) : khacPrev(theCategory);
            target = sinhNext(vc3);
            formula = "Vợ/chồng = " + vc3 + "; anh chị em vợ/chồng = " + vc3 + " (ngang vai) → con của họ: " + vc3 + " sinh " + target + " (cháu bên vợ/chồng).";
            break;
          }
          case "vo-chong-cua-nguoi-ngang-vai": {
            var sibling = theCategory;
            if (gioiAnhChiEm === "nu") {
              target = khacPrev(sibling);
              formula = "Anh/chị/em ruột (Nữ, ngang vai Thế) = " + sibling + "; " + target + " khắc " + sibling + " → " + target + " là chồng (anh rể/em rể).";
            } else {
              target = khacNext(sibling);
              formula = "Anh/chị/em ruột (Nam, ngang vai Thế) = " + sibling + "; " + sibling + " khắc " + target + " → " + target + " là vợ (em dâu).";
            }
            break;
          }
          default:
            return null;
        }
        return { target: target, formula: formula };
  }

  /* ---------------- 4. CHẠY TOÀN BỘ QUY TRÌNH ---------------- */

  window.m07_run = function m07_run() {
        var outEl = document.getElementById("m07Output");
        var que = m07_getQueChinh();
        if (!que) {
          outEl.value = "⚠️ Vui lòng chọn Họ Quẻ & Tên Quẻ ở phần LẬP QUẺ phía trên trước khi xử lý Lục Thân Thật/Giả.";
          outEl.style.display = "block";
          return;
        }

        var theInfo = m07_findThe(que.data);
        if (!theInfo) {
          outEl.value = "⚠️ Không xác định được hào Thế trong quẻ " + que.qName + ".";
          outEl.style.display = "block";
          return;
        }

        var dungThan = document.getElementById("m07DungThan").value;
        var inOrOut = document.getElementById("m07TrongNgoai").value;
        if (!dungThan || !inOrOut) {
          outEl.value = "⚠️ Vui lòng chọn đầy đủ Dụng Thần Lục Thân và Trong/Ngoài.";
          outEl.style.display = "block";
          return;
        }

        var lines = [];
        lines.push("=== LỤC THÂN THẬT / GIẢ ===");
        lines.push("Quẻ Chính: " + que.qName + " (Họ " + que.cung.name + " - " + que.cung.hanh + ")");
        lines.push("Thế hào: " + theInfo.lucThan + " " + theInfo.chi + " " + theInfo.hanh + " (hào " + theInfo.hao + ")");
        lines.push("Dụng Thần cần tìm: " + dungThan + " — Lục Thân " + (inOrOut === "trong" ? "Trong" : "Ngoài"));
        lines.push("");

        // CASE 1
        var r1 = m07_case1(que, dungThan, inOrOut);
        if (r1.success) {
          lines.push("✅ CASE 1 THÀNH CÔNG");
          lines.push(r1.note);
          lines.push("");
          lines.push("→ LỤC THÂN THẬT: " + dungThan + " " + r1.chi + " " + r1.hanh + " tại hào " + r1.hao + ".");
          m07_finish(outEl, lines, { case: 1, dungThan: dungThan, inOrOut: inOrOut, theInfo: theInfo, hao: r1.hao, chi: r1.chi, hanh: r1.hanh, phucThan: false });
          return;
        }
        lines.push("❌ Case 1: " + r1.reason);

        // CASE 2
        var r2 = m07_timQuaPhucThanQueThuan(que, dungThan, inOrOut);
        if (r2.success) {
          lines.push("✅ CASE 2 THÀNH CÔNG (Phục Thần)");
          lines.push(r2.note);
          lines.push("");
          lines.push("→ LỤC THÂN THẬT: " + dungThan + " " + r2.chi + " " + r2.hanh + " — Phục Thần dưới hào " + r2.hao + ".");
          m07_finish(outEl, lines, { case: 2, dungThan: dungThan, inOrOut: inOrOut, theInfo: theInfo, hao: r2.hao, chi: r2.chi, hanh: r2.hanh, phucThan: true });
          return;
        }
        lines.push("❌ Case 2: " + r2.reason);

        // CASE 3
        var quanHe = document.getElementById("m07QuanHe").value;
        if (!quanHe) {
          lines.push("");
          lines.push("⚠️ Case 1 & 2 đều thất bại. Để tính Case 3 (bắc cầu qua hào Thế), vui lòng chọn \"Quan hệ với Thế hào\" bên dưới rồi bấm xử lý lại.");
          outEl.value = lines.join("\n");
          outEl.style.display = "block";
          return;
        }
        var gioiNguoiHoi = document.getElementById("m07GioiTinh").value;
        var gioiAnhChiEm = document.getElementById("m07GioiTinhACE").value;
        var needsGender = ["vo-chong", "cha-me-vo-chong", "anh-chi-em-vo-chong", "chau-ben-vo-chong"].indexOf(quanHe) > -1;
        if (needsGender && !gioiNguoiHoi) {
          lines.push("");
          lines.push("⚠️ Quan hệ này cần biết giới tính người hỏi quẻ (Nam/Nữ) để tính vợ/chồng. Vui lòng chọn rồi xử lý lại.");
          outEl.value = lines.join("\n");
          outEl.style.display = "block";
          return;
        }
        if (quanHe === "vo-chong-cua-nguoi-ngang-vai" && !gioiAnhChiEm) {
          lines.push("");
          lines.push("⚠️ Quan hệ này cần biết giới tính của Anh/Chị/Em ruột đó (Nam/Nữ). Vui lòng chọn rồi xử lý lại.");
          outEl.value = lines.join("\n");
          outEl.style.display = "block";
          return;
        }

        var c3 = m07_tinhLucThanTheoQuanHe(theInfo.lucThan, quanHe, gioiNguoiHoi, gioiAnhChiEm);
        if (!c3) {
          lines.push("");
          lines.push("⚠️ Quan hệ chưa hỗ trợ.");
          outEl.value = lines.join("\n");
          outEl.style.display = "block";
          return;
        }
        lines.push("");
        lines.push("➡️ CASE 3 (bắc cầu qua Thế): " + c3.formula);
        lines.push("Lục Thân cần tìm thật sự là: " + c3.target + " (thay vì " + dungThan + " đã chọn ban đầu).");
        lines.push("");

        var r3 = m07_timQuaPhucThanQueThuan(que, c3.target, inOrOut);
        if (r3.success) {
          lines.push("✅ CASE 3 THÀNH CÔNG (Phục Thần của " + c3.target + " tại quẻ Thuần)");
          lines.push(r3.note);
          lines.push("");
          lines.push("→ LỤC THÂN THẬT: " + c3.target + " " + r3.chi + " " + r3.hanh + " — Phục Thần dưới hào " + r3.hao + ".");
          lines.push("(Chỉ là biểu tượng/dụng thần đại diện để đo vượng suy — không tự luận cát hung ở module này.)");
          m07_finish(outEl, lines, { case: 3, dungThan: dungThan, originalDungThan: dungThan, target: c3.target, inOrOut: inOrOut, theInfo: theInfo, quanHe: quanHe, hao: r3.hao, chi: r3.chi, hanh: r3.hanh, phucThan: true });
          return;
        }
        lines.push("❌ Case 3: " + r3.reason + " Không tìm được Lục Thân Thật qua cả 3 case.");
        outEl.value = lines.join("\n");
        outEl.style.display = "block";
  };

  function m07_finish(outEl, lines, resultObj) {
        outEl.value = lines.join("\n");
        outEl.style.display = "block";
        window.M07_LucThanThatGia = resultObj;
  }

  window.getM07Result = function () {
        return window.M07_LucThanThatGia || null;
  };

  /* ---------------- 5. GIAO DIỆN (UI) ---------------- */

  var M07_HTML = ""
        + '<style>'
        + '  .m07-row{display:flex;align-items:center;justify-content:space-between;}'
        + '  .m07-toggle{background:transparent;border:1px solid var(--gold);color:var(--gold);'
        + '        border-radius:8px;padding:4px 10px;font-size:0.72rem;cursor:pointer;font-family:inherit;}'
        + '  .m07-body{margin-top:12px;}'
        + '  .m07-body.collapsed{display:none;}'
        + '  .m07-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}'
        + '  .m07-grid select{width:100%;padding:10px;border-radius:8px;border:1px solid #444;'
        + '        background:#252525;color:white;font-family:inherit;font-size:0.85rem;box-sizing:border-box;}'
        + '  .m07-sub{display:none;margin-top:10px;}'
        + '  .m07-sub.show{display:block;}'
        + '</style>'
        + '<div class="m07-row">'
        + '  <h1 style="font-size:1.1rem;color:var(--gold);margin:0;letter-spacing:1px;">M07 · LỤC THÂN THẬT / GIẢ</h1>'
        + '  <button type="button" class="m07-toggle" id="m07ToggleBtn" onclick="m07_toggleCollapse()">▼ Thu gọn</button>'
        + '</div>'
        + '<div class="m07-body" id="m07Body">'
        + '  <label>Dụng Thần Lục Thân</label>'
        + '  <div class="m07-grid">'
        + '        <select id="m07DungThan">'
        + '          <option value="">-- Chọn Lục Thân --</option>'
        + '          <option value="Phụ Mẫu">Phụ Mẫu</option>'
        + '          <option value="Huynh Đệ">Huynh Đệ</option>'
        + '          <option value="Tử Tôn">Tử Tôn</option>'
        + '          <option value="Thê Tài">Thê Tài</option>'
        + '          <option value="Quan Quỷ">Quan Quỷ</option>'
        + '        </select>'
        + '        <select id="m07TrongNgoai">'
        + '          <option value="">-- Trong / Ngoài --</option>'
        + '          <option value="trong">Lục Thân Trong</option>'
        + '          <option value="ngoai">Lục Thân Ngoài</option>'
        + '        </select>'
        + '  </div>'
        + '  <label style="margin-top:12px;">Quan hệ với Thế hào (chỉ dùng khi Case 1 &amp; 2 thất bại — Case 3)</label>'
        + '  <select id="m07QuanHe" onchange="m07_onQuanHeChange()">'
        + '        <option value="">-- Không cần / chưa biết --</option>'
        + '        <option value="ngang-vai">Ngang vai (anh/chị/em ruột)</option>'
        + '        <option value="con">Con ruột</option>'
        + '        <option value="chau-noi">Cháu nội (con của con)</option>'
        + '        <option value="cha-me">Cha mẹ ruột</option>'
        + '        <option value="ong-ba">Ông bà nội</option>'
        + '        <option value="vo-chong">Vợ / Chồng</option>'
        + '        <option value="cha-me-vo-chong">Cha mẹ vợ / chồng</option>'
        + '        <option value="anh-chi-em-vo-chong">Anh chị em vợ / chồng</option>'
        + '        <option value="chau-ben-vo-chong">Cháu bên vợ / chồng</option>'
        + '        <option value="vo-chong-cua-nguoi-ngang-vai">Vợ/chồng của anh chị em ruột (anh rể / em rể / em dâu)</option>'
        + '  </select>'
        + '  <div class="m07-sub" id="m07SubGioiTinh">'
        + '        <label>Giới tính người hỏi quẻ</label>'
        + '        <select id="m07GioiTinh">'
        + '          <option value="">-- Chọn --</option>'
        + '          <option value="nam">Nam</option>'
        + '          <option value="nu">Nữ</option>'
        + '        </select>'
        + '  </div>'
        + '  <div class="m07-sub" id="m07SubGioiTinhACE">'
        + '        <label>Giới tính của Anh/Chị/Em ruột đó</label>'
        + '        <select id="m07GioiTinhACE">'
        + '          <option value="">-- Chọn --</option>'
        + '          <option value="nam">Nam (em trai → tìm em dâu)</option>'
        + '          <option value="nu">Nữ (em gái → tìm anh/em rể)</option>'
        + '        </select>'
        + '  </div>'
        + '  <button class="m-btn-process" onclick="m07_run()">🔍 XỬ LÝ LỤC THÂN THẬT / GIẢ</button>'
        + '  <textarea id="m07Output" class="m-output-box" readonly onclick="this.select()"></textarea>'
        + '</div>';

  window.m07_onQuanHeChange = function () {
        var v = document.getElementById("m07QuanHe").value;
        var needsGender = ["vo-chong", "cha-me-vo-chong", "anh-chi-em-vo-chong", "chau-ben-vo-chong"].indexOf(v) > -1;
        var needsACE = v === "vo-chong-cua-nguoi-ngang-vai";
        document.getElementById("m07SubGioiTinh").classList.toggle("show", needsGender);
        document.getElementById("m07SubGioiTinhACE").classList.toggle("show", needsACE);
  };

  window.m07_toggleCollapse = function () {
    var body = document.getElementById("m07Body");
    var btn = document.getElementById("m07ToggleBtn");
    var collapsed = body.classList.toggle("collapsed");
    
    // Thay textContent bằng innerHTML và dùng mã Unicode chuẩn &#9654; (▶) và &#9660; (▼)
    btn.innerHTML = collapsed ? "&#9654; Mở rộng" : "&#9660; Thu gọn";
};

  function m07_init() {
        if (typeof moduleSlot === "function") {
          moduleSlot(M07_HTML);
        } else {
          // dự phòng nếu moduleSlot chưa sẵn sàng (không đúng thứ tự load)
          var holder = document.getElementById("module-slots");
          if (holder) {
            var div = document.createElement("div");
            div.className = "box module-container";
            div.innerHTML = M07_HTML;
            holder.appendChild(div);
          }
        }
  }

  if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", m07_init);
  } else {
        m07_init();
  }
})();
