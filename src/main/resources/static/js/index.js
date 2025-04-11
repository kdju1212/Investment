let tableCreated = false;
const priceSpans = {}; // 실시간 가격 정보 매핑

// 테이블이 없으면 생성
function createTableIfNotExist() {
	if (tableCreated) return;

	const table = document.createElement('table');
	table.id = 'assetTable';
	table.innerHTML = `
		<thead>
			<tr>
				<th>투자종류</th>
				<th>이름</th>
				<th>매수평균가</th>
				<th>매수금액</th>
				<th>현재가</th>
				<th>이익가</th>
				<th>수익률</th>
			</tr>
		</thead>
		<tbody id="assetBody"></tbody>
	`;

	document.getElementById('inventory').appendChild(table);
	tableCreated = true;
}

// SSE 연결
const eventSource = new EventSource('/price-stream');
eventSource.onmessage = (event) => {
	const data = JSON.parse(event.data);
	const info = priceSpans[data.code];
	if (!info) return;

	const price = parseFloat(data.price);
	if (isNaN(price)) return;

	info.current.textContent = `${price.toLocaleString()}원`;

	const quantity = info.amount / info.avgPrice;
	const profit = Math.round(price * quantity - info.amount);
	const rate = ((profit / info.amount) * 100).toFixed(2);

	info.profit.textContent = `${profit.toLocaleString()}원`;
	info.rate.textContent = `${rate}%`;
};

document.getElementById('addButton').addEventListener('click', () => {
	const inventory = document.getElementById('inventory');

	const item = document.createElement('div');
	item.className = 'item';

	// 종류 선택 드롭다운
	const select = document.createElement('select');
	const option = new Option('선택', '');
	option.disabled = true;
	option.selected = true;
	const option1 = new Option('코인', 'coin');
	const option2 = new Option('주식', 'stock');
	select.append(option, option1, option2);
	item.appendChild(select);

	// 입력창 3개
	const inputs = [];
	for (let i = 0; i < 3; i++) {
		const input = document.createElement('input');
		input.type = 'text';
		input.placeholder = 'text';
		inputs.push(input);
		item.appendChild(input);
	}

	// 드롭다운 선택 시 placeholder 설정
	select.addEventListener('change', () => {
		if (select.value === 'stock') {
			inputs[0].placeholder = '기업';
			inputs[1].placeholder = '평단가(원)';
			inputs[2].placeholder = '수량(개)';
			inputs[0].removeAttribute('list');
		} else if (select.value === 'coin') {
			inputs[0].placeholder = '코인 이름';
			inputs[1].placeholder = '평단가(원)';
			inputs[2].placeholder = '매수 금액(원)';
			inputs[0].setAttribute('list', 'coin-list');

			// 코인 목록 불러오기
			fetch('https://api.upbit.com/v1/market/all?isDetails=false')
				.then(res => res.json())
				.then(data => {
					const datalist = document.getElementById('coin-list');
					datalist.innerHTML = '';
					data.forEach(market => {
						const option = document.createElement('option');
						option.value = market.korean_name;
						datalist.appendChild(option);
					});
				});
		} else {
			inputs[0].placeholder = 'text';
			inputs[1].placeholder = 'text';
			inputs[2].placeholder = 'text';
			inputs[0].removeAttribute('list');
		}
	});

	inventory.appendChild(item);

	// 제출 버튼
	const submitButton = document.createElement('button');
	submitButton.textContent = '제출';
	submitButton.type = 'button';
	item.appendChild(submitButton);

	submitButton.addEventListener('click', () => {
		// 유효성 검사
		for (let i = 0; i < inputs.length; i++) {
			if (!inputs[i].value.trim()) {
				alert(`입력 ${i + 1}이(가) 비어 있습니다.`);
				return;
			}
		}
		if (!select.value) {
			alert('종류를 선택해주세요.');
			return;
		}

		const type = select.value;
		const name = inputs[0].value.trim();
		const avgPrice = inputs[1].value.trim();
		const amount = inputs[2].value.trim();

		const payload = {
			type: type,
			name: name,
			price: avgPrice,
			amount: amount
		};

		fetch('/api/asset/add', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		})
			.then(res => res.text())
			.then(msg => {
				alert(msg);

				// 입력 요소 제거
				select.remove();
				inputs.forEach(input => input.remove());
				submitButton.remove();

				createTableIfNotExist();

				const marketCodeMatch = msg.match(/KRW-[A-Z0-9]+/);
				const marketCode = marketCodeMatch ? marketCodeMatch[0] : null;

				const tbody = document.getElementById('assetBody');
				const row = document.createElement('tr');

				const typeCell = document.createElement('td');
				const nameCell = document.createElement('td');
				const avgCell = document.createElement('td');
				const amountCell = document.createElement('td');
				const currentCell = document.createElement('td');
				const profitCell = document.createElement('td');
				const rateCell = document.createElement('td');

				typeCell.textContent = type;
				nameCell.textContent = name;
				avgCell.textContent = avgPrice;
				amountCell.textContent = amount;
				currentCell.textContent = marketCode ? '로딩중...' : '-';
				profitCell.textContent = marketCode ? '계산중...' : '-';
				rateCell.textContent = marketCode ? '계산중...' : '-';

				row.append(typeCell, nameCell, avgCell, amountCell, currentCell, profitCell, rateCell);
				tbody.appendChild(row);

				// 실시간 가격 갱신 등록
				const avg = parseFloat(avgPrice.replace(/,/g, ''));
				const buyAmount = parseFloat(amount.replace(/,/g, ''));
				if (marketCode && !isNaN(avg) && !isNaN(buyAmount)) {
					priceSpans[marketCode] = {
						current: currentCell,
						profit: profitCell,
						rate: rateCell,
						avgPrice: avg,
						amount: buyAmount
					};
				}
			})
			.catch(err => alert("서버 오류 발생"));
	});
});
