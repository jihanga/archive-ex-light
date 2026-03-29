if (document.readyState === "loading") {
  // 아직 파싱 중이면 이벤트 등록
  window.addEventListener("DOMContentLoaded", exInit);
} else {
  // 이미 완료됐으면 바로 실행
  exInit();
}

let isShowTime = false;

function exInit() {
  //1. 최근기록에서 dom에 데이터를 불러올때까지 대기함
  const targetSelector = "[data-component='recent-records'] .pc_only";
  const container = document.querySelector(targetSelector);

  //2. insertRecord는 비동기로 실행될 가능성이 있으므로 함수를 따로 뺌
  if (container) {
    if (container.classList.contains("set-ex")) return;
    container.classList.add("set-ex");
    insertRecord(targetSelector);
  } else {
    const containerObserver = new MutationObserver(() => {
      const container = document.querySelector(targetSelector);
      if (container) {
        if (container.classList.contains("set-ex")) return;
        container.classList.add("set-ex");
        insertRecord(targetSelector);
      }
    });

    containerObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

async function insertRecord(targetSelector) {
  const data = await fetch(`https://v-archive.net/api/v3/my/recent`, {
    credentials: "include", // 사이트 쿠키 포함 (로그인 세션 등)
  });
  const json = await data.json();
  /*
{
  records = [
    {
      "userNo": 11397,
      "title": 789,
      "name": "LAMIA",
      "button": 8,
      "pattern": "MX",
      "level": 15,
      "score": 95.92,
      "maxCombo": 0,
      "newIcon": 1,
      "ymdt": "2026-03-29T07:04:15.000Z",
      "beforeScore": null,
      "beforeMaxCombo": null
    },
  ],
  success = true
}
    */

  const container = document.querySelector(targetSelector);
  const rows = container.querySelectorAll("tbody tr");

  rows.forEach((row, index) => {
    const recordData = json["records"][index];
    const titleDiv = row.querySelectorAll("td")[3].querySelectorAll("div")[0];
    const { button, title, pattern } = recordData;

    const newSpan = document.createElement("button");
    newSpan.textContent = "기록";

    newSpan.style.cursor = "pointer";

    newSpan.addEventListener("click", async () => {
      const url = `https://v-archive.net/api/v3/archive/record-history?title=${title}&button=${button}&pattern=${pattern}&judge=NM`;

      const rect = row.getBoundingClientRect();
      const res = await fetch(url);
      const data = await res.json();

      showOverlay(data, rect);
    });

    titleDiv.insertBefore(newSpan, titleDiv.querySelector("a"));
  });
}

function showOverlay(data, rect) {
  document.querySelector("#jacketPopup")?.remove();

  const popup = document.createElement("div");
  popup.id = "jacketPopup";
  popup.className = "jacketPopup";
  popup.style.cssText = `
    position: absolute;
    left: ${rect.left + window.scrollX}px;
    z-index: 9999;
    width:${isShowTime ? "330px" : "220px"};
    background-color: var(--background);
    border-color: var(--color-gray-500);    
    border-style: var(--tw-border-style);
    border-width: 1px;
  `;

  const titleDiv = document.createElement("div");
  titleDiv.className = "jacket_popup_title";
  titleDiv.style.cssText =
    "align-items: center; justify-content: space-between; margin-left: 8px; margin-right: 8px;";
  titleDiv.innerHTML = `
    <div class="flex items-center mt-2 gap-4">
      <span class="font-bold text-sm text-gray-900 dark:text-gray-100">
        기록 히스토리
      </span>
      <label style="font-size: 12px; font-weight: normal; cursor: pointer;">
        <input type="checkbox" id="show-time-checkbox" style="margin-right: 4px;">
        시간 표시
      </label>
    </div>
 `;

  const boardDiv = document.createElement("div");
  boardDiv.className = "max-h-[200px] overflow-y-auto mb-2 pr-1";
  boardDiv.innerHTML = `
    <table class="w-full text-xs border-collapse border border-gray-300 dark:border-zinc-600">
      <tbody class="score_history_board"></tbody>
    </table>
  `;

  const board = boardDiv.querySelector("tbody");
  data.history.forEach((item) => {
    // 구조만 innerHTML로
    board.insertAdjacentHTML(
      "beforeend",
      `
        <tr class="score_history_row border-b border-gray-300 dark:border-zinc-600">
          <td style="min-width: ${isShowTime ? "210px" : "100px"};" 
              class="py-1.5 px-1 text-gray-600 dark:text-gray-400 whitespace-nowrap font-bold text-center w-1/2 text-[14px]">
          </td>
          <td class="py-1.5 px-1 text-center text-base relative ${item.maxCombo === 1 ? (item.score === "100" ? "bg-[color:var(--perfect)]" : "bg-[color:var(--maxcombo)]") : "bg-[color:var(--clear)]"} text-white outline-text-3">
            <span class="inline-block px-1.5 py-0.5 rounded-sm font-bold tabular-nums"></span>
          </td>
        </tr>
      `,
    );

    // 동적 데이터는 따로 세팅
    const lastRow = board.lastElementChild;
    lastRow.cells[0].textContent = formatDate(item.ymdt);
    lastRow.cells[1].querySelector("span").textContent = item.score;
  });

  popup.appendChild(titleDiv);
  popup.appendChild(boardDiv);
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
