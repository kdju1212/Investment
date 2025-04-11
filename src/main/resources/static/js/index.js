// 전역에서 한 번만 연결되는 SSE
const priceSpans = {}; // code: span 매핑
const eventSource = new EventSource('/price-stream');

eventSource.onmessage = (event) => {
	const data = JSON.parse(event.data);
	const info = priceSpans[data.code];

	if (data && data.code && info) {
		const price = parseFloat(data.price.toString().replace(/[^0-9.]/g, ''));
		if (!isNaN(price)) {
			// 현재가 갱신
			info.current.textContent = `${price.toLocaleString()}원`;

			// 이익가 갱신
			if (info.profit && info.avgPrice && info.amount) {
				const quantity = info.amount / info.avgPrice;
				const profit = Math.round(price * quantity - info.amount);
				info.profit.textContent = ` (이익가: ${profit.toLocaleString()}원)`;
			}
		}
	}
};

document.getElementById('addButton').addEventListener('click', () => {
	const inventory = document.getElementById('inventory');

	const item = document.createElement('div');
	item.className = 'item';

	// 드롭다운 메뉴
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

				// Market Code 추출
				const marketCodeMatch = msg.match(/KRW-[A-Z0-9]+/);
				const marketCode = marketCodeMatch ? marketCodeMatch[0] : null;

				// 현재가 span
				const currentPriceSpan = document.createElement('span');
				currentPriceSpan.textContent = type === 'coin' && marketCode
					? '(현재가 로딩중...)'
					: '(실시간 미지원)';

				// 이익가 span
				const profitSpan = document.createElement('span');
				profitSpan.textContent = type === 'coin' ? ' (이익가 계산중...)' : '';

				// 숫자 추출
				let avg = null, buyAmount = null;
				if (type === 'coin' && marketCode) {
					avg = parseFloat(avgPrice.replace(/,/g, ''));
					buyAmount = parseFloat(amount.replace(/,/g, ''));

					if (!isNaN(avg) && !isNaN(buyAmount) && avg > 0) {
						// 실시간 가격 등록
						priceSpans[marketCode] = {
							current: currentPriceSpan,
							profit: profitSpan,
							avgPrice: avg,
							amount: buyAmount
						};
					}
				}

				// 정보 표시
				const infoSpan = document.createElement('span');
				infoSpan.innerHTML = `(${type}) (${name}) `;
				item.appendChild(infoSpan);
				item.appendChild(currentPriceSpan);
				item.appendChild(document.createTextNode(` (${avgPrice}) (${amount})`));
				item.appendChild(profitSpan);
			})
			.catch(err => alert("서버 오류 발생"));
	});

	item.appendChild(submitButton);
});
