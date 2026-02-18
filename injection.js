if (document.readyState === "loading") {
  // 아직 파싱 중이면 이벤트 등록
  window.addEventListener("DOMContentLoaded", exInit);
} else {
  // 이미 완료됐으면 바로 실행
  exInit();
}

let isShowTime = false;

function exInit() {
  if (location.href.indexOf("recent") > 0) {
    const rows = document.querySelectorAll(".rating_list_row");

    rows.forEach((row) => {
      const input = row.querySelector("input.deleteRecentRecordCheckbox");

      const button = input?.dataset.button;
      const title = input?.dataset.title;
      const pattern = input?.dataset.pattern;

      const url = `https://v-archive.net/api/archive/userRecordHistory?button=${button}&title=${title}&pattern=${pattern}`;

      // title div 클릭 이벤트
      const titleDiv = row.querySelector(".title");
      titleDiv.style.cursor = "pointer";

      titleDiv.addEventListener("click", async () => {
        const rect = row.getBoundingClientRect();
        const res = await fetch(url);
        const data = await res.json();

        showOverlay(data, rect);
      });
    });
  }
}

function showOverlay(data, rect) {
  document.querySelector("#jacketPopup")?.remove();

  const popup = document.createElement("div");
  popup.id = "jacketPopup";
  popup.className = "jacketPopup bg_white";
  popup.style.cssText = `
    position: absolute;
    left: ${rect.left + window.scrollX}px;
    z-index: 9999;
    width:${isShowTime ? "330px" : "220px"}
  `;

  const titleDiv = document.createElement("div");
  titleDiv.className = "jacket_popup_title";
  titleDiv.style.cssText =
    "display: flex; align-items: center; justify-content: space-between; margin-left: 8px; margin-right: 8px;";
  titleDiv.innerHTML = `
    <span>기록 히스토리</span>
    <label style="font-size: 12px; font-weight: normal; cursor: pointer;">
      <input type="checkbox" id="show-time-checkbox" style="margin-right: 4px;">
      시간 표시
    </label>
  `;

  const board = document.createElement("div");
  board.className = "score_history_board";
  board.style.cssText = `
    width:${isShowTime ? "310px" : "200px"}
  `;

  data.history.forEach((item) => {
    const row = document.createElement("div");
    row.className = "score_history_row";
    row.dataset.ymdt = item.ymdt;
    row.innerHTML = `
      <span class="history_ymdt" style="min-width: ${isShowTime ? "210px" : "100px"};">${formatDate(item.ymdt)}</span>
      <span class="history_score ${item.maxCombo === 1 ? (item.score === "100.00" ? "score_perfect" : "score_maxcombo") : "score_clear"}">${item.score}</span>
    `;
    board.appendChild(row);
  });

  popup.appendChild(titleDiv);
  popup.appendChild(board);
  document.body.appendChild(popup);

  const checkbox = popup.querySelector("#show-time-checkbox");

  checkbox.checked = isShowTime;

  // 렌더링 후 높이 계산해서 row 위에 배치
  const popupHeight = popup.offsetHeight;
  popup.style.top = `${rect.top + window.scrollY - popupHeight}px`;

  // 체크박스 이벤트
  checkbox.addEventListener("change", (e) => {
    isShowTime = e.target.checked;
    showOverlay(data, rect);
  });

  // 팝업 외부 클릭시 닫기
  document.addEventListener(
    "click",
    (e) => {
      if (!popup.contains(e.target)) popup.remove();
    },
    { once: true },
  );
}

function formatDate(ymdt) {
  const date = new Date(ymdt);
  const dateStr = date.toLocaleDateString("ko-KR");
  if (!isShowTime) return dateStr;
  const timeStr = date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${dateStr} ${timeStr}`;
}
