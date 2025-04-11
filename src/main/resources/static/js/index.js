// 전역에서 한 번만 연결되는 SSE
const priceSpans = {}; // code: { current, profit, ratio, avgPrice, amount } 매핑
const eventSource = new EventSource('/price-stream');
eventSource.onmessage = (event) => {
	const data = JSON.parse(event.data);
	const info = priceSpans[data.code];
	if (data && data.code && info) {
		const price = parseFloat(data.price);
		if (!isNaN(price)) {
			info.current.textContent = `${price.toLocaleString()}원`;

			const quantity = info.amount / info.avgPrice;
			const profit = Math.round(price * quantity - info.amount);
			const ratio = ((profit / info.amount) * 100).toFixed(2);

			info.profit.textContent = `${profit.toLocaleString()}원`;
			info.ratio.textContent = `${ratio}%`;
		}
	}
};

document.getElementById('addButton').addEventListener('click', () => {
	const inventory = document.getElementById('inventory');

	// 입력창 3개 저장할 배열
	const item = document.createElement('div');
	item.className = 'item';

	const select = document.createElement('select');
	const option = new Option('선택', '');
	option.disabled = true;
	option.selected = true;
	const option1 = new Option('코인', 'coin');
	const option2 = new Option('주식', 'stock');
	select.append(option, option1, option2);
	item.appendChild(select);

	const inputs = [];
	for (let i = 0; i < 3; i++) {
		const input = document.createElement('input');
		input.type = 'text';
		input.placeholder = 'text';
		inputs.push(input);
		item.appendChild(input);
	}

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
		}
	});

	const submitButton = document.createElement('button');
	submitButton.textContent = '제출';
	submitButton.type = 'button';
	submitButton.addEventListener('click', () => {
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
		const avgPriceStr = inputs[1].value.trim().replace(/,/g, '').replace(/원/g, '');
		const amountStr = inputs[2].value.trim().replace(/,/g, '').replace(/원/g, '');

		const avg = parseFloat(avgPriceStr);
		const amount = parseFloat(amountStr);

		if (isNaN(avg) || isNaN(amount)) {
			alert('숫자 형식이 잘못되었습니다.');
			return;
		}

		const payload = {
			type,
			name,
			price: avg,
			amount
		};

		fetch('/api/asset/add', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		})
			.then(res => res.text())
			.then(msg => {
				alert(msg);

				// 입력 요소 제거
				select.remove();
				inputs.forEach(input => input.remove());
				submitButton.remove();

				const marketCodeMatch = msg.match(/KRW-[A-Z0-9]+/);
				const marketCode = marketCodeMatch ? marketCodeMatch[0] : null;

				// 테이블 없으면 생성
				let table = document.querySelector('table');
				if (!table) {
					table = document.createElement('table');
					const thead = document.createElement('thead');
					thead.innerHTML = `
						<tr>
							<th>투자종류</th>
							<th>기업/코인</th>
							<th>현재가</th>
							<th>매수평균가</th>
							<th>매수금액</th>
							<th>이익가</th>
							<th>수익률</th>
						</tr>`;
					table.appendChild(thead);
					table.appendChild(document.createElement('tbody'));
					inventory.appendChild(table);
				}

				const tbody = table.querySelector('tbody');
				const tr = document.createElement('tr');

				const tdType = document.createElement('td');
				tdType.textContent = type;

				const tdName = document.createElement('td');
				tdName.textContent = name;

				const tdCurrent = document.createElement('td');
				tdCurrent.textContent = marketCode ? '로딩 중...' : '실시간 미지원';

				const tdAvg = document.createElement('td');
				tdAvg.textContent = avg.toLocaleString() + '원';

				const tdAmount = document.createElement('td');
				tdAmount.textContent = amount.toLocaleString() + '원';

				const tdProfit = document.createElement('td');
				tdProfit.textContent = marketCode ? '계산중...' : '-';

				const tdRatio = document.createElement('td');
				tdRatio.textContent = marketCode ? '...' : '-';

				tr.append(tdType, tdName, tdCurrent, tdAvg, tdAmount, tdProfit, tdRatio);
				tbody.appendChild(tr);

				// 실시간 가격 갱신 매핑 등록
				if (marketCode) {
					priceSpans[marketCode] = {
						current: tdCurrent,
						profit: tdProfit,
						ratio: tdRatio,
						avgPrice: avg,
						amount: amount
					};
				}
			})
			.catch(err => alert("서버 오류 발생"));
	});

	item.appendChild(select);
	inputs.forEach(input => item.appendChild(input));
	item.appendChild(submitButton);
	inventory.appendChild(item);
});
