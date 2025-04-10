package com.office.tuja.coin;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.PostConstruct;

@RestController
@RequestMapping("/api/asset")
public class AssetController {

	private final GenericWebSocketClient socketClient;
	private final Map<String, String> coinMap = new HashMap<>();

	public AssetController(GenericWebSocketClient socketClient) {
		this.socketClient = socketClient;
	}

	@PostConstruct
	public void initCoinMap() {
		RestTemplate restTemplate = new RestTemplate();
		String url = "https://api.upbit.com/v1/market/all?isDetails=false";

		try {
			ResponseEntity<Map[]> response = restTemplate.getForEntity(url, Map[].class);
			if (response.getBody() != null) {
				for (Map item : response.getBody()) {
					String market = (String) item.get("market"); // KRW-BTC
					String koreanName = (String) item.get("korean_name"); // 비트코인
					if (market.startsWith("KRW-")) { // 원화 마켓만
						coinMap.put(koreanName, market);
					}
				}
				System.out.println("✅ coinMap 초기화 완료: " + coinMap.size() + "개 등록됨");
			}
		} catch (Exception e) {
			System.out.println("❌ coinMap 초기화 실패: " + e.getMessage());
		}
	}

	@PostMapping("/add")
	public ResponseEntity<String> addAsset(@RequestBody Map<String, String> payload) {
		String type = payload.get("type");
		String name = payload.get("name");

		if ("coin".equals(type)) {
			String marketCode = coinMap.get(name);
			if (marketCode == null) {
				return ResponseEntity.badRequest().body("지원하지 않는 코인 이름입니다.");
			}
			socketClient.addSubscription(marketCode);
			return ResponseEntity.ok("구독 추가 완료: " + marketCode);
		}

		return ResponseEntity.ok("주식은 아직 미구현입니다.");
	}
}
