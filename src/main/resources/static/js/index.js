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
    select.append(option,option1, option2);
    item.appendChild(select);

    // 입력창 5개 저장할 배열
    const inputs = [];

    for (let i = 1; i <= 3; i++) {
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'text';
        inputs.push(input);
        item.appendChild(input);
    }

    // 드롭다운 선택 시 입력창 placeholder 변경
    select.addEventListener('change', () => {
        if (select.value === 'stock') {
            inputs[0].placeholder = '기업'; // 두 번째 입력칸
			inputs[1].placeholder = '평단가(원)'; // 두 번째 입력칸
            inputs[2].placeholder = '수량(개)'; // 네 번째 입력칸
			inputs[0].removeAttribute('list'); // datalist 제거
        } else if (select.value === 'coin'){
            // 원래대로 초기화 (코인 선택 시)
            inputs[0].placeholder = '코인 이름';
			inputs[1].placeholder = '평단가(원)'; // 두 번째 입력칸
            inputs[2].placeholder = '매수 금액(원)';
			inputs[0].setAttribute('list', 'coin-list');

        	// 💡 업비트에서 코인 목록 불러오기
        	fetch('https://api.upbit.com/v1/market/all?isDetails=false')
	            .then(res => res.json())
            	.then(data => {
	                const datalist = document.getElementById('coin-list') || document.createElement('datalist');
                	datalist.id = 'coin-list';
                	datalist.innerHTML = ''; // 기존 목록 초기화
	
                	data.forEach(market => {
	                    const option = document.createElement('option');
                    	option.value = market.korean_name; // 예: 비트코인
                    	datalist.appendChild(option);
                	});
	
                	// DOM에 datalist 없으면 추가
                	if (!document.getElementById('coin-list')) {
	                    document.body.appendChild(datalist);
                	}
            	});
        } else {
			inputs[0].placeholder = 'text';
			inputs[1].placeholder = 'text';
            inputs[2].placeholder = 'text';
			inputs[0].removeAttribute('list');
		}
    });

    inventory.appendChild(item);

	// 제출 버튼 추가
	const submitButton = document.createElement('button');
	submitButton.textContent = '제출';
	submitButton.type = 'button'; // 기본 폼 전송 막기

	submitButton.addEventListener('click', () => {
	    // 유효성 검사: 빈 input 있으면 경고 후 중단
	    for (let i = 0; i < inputs.length; i++) {
        	if (!inputs[i].value.trim()) {
	            alert(`입력 ${i + 1}이(가) 비어 있습니다.`);
            	return; // 중단
        	}
    	}

	    // 드롭다운도 선택 안 했을 때 막기
	    if (!select.value) {
        	alert('종류를 선택해주세요.');
        	return;
    	}
	
	    // 모든 값이 채워져 있으면 제출 처리
	    console.log('종류:', select.value);
	    inputs.forEach((input, index) => {
        	console.log(`입력 ${index + 1}:`, input.value);
    	});

	});


	item.appendChild(submitButton);

});
