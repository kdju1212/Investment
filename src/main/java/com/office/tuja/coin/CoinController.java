package com.office.tuja.coin;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/coins")
public class CoinController {

	private final GenericWebSocketClient webSocketClient;

	public CoinController(GenericWebSocketClient webSocketClient) {
		this.webSocketClient = webSocketClient;
	}

	@PostMapping("/add")
	public ResponseEntity<String> addCoin(@RequestParam String coinCode) {
		try {
			String formatted = coinCode.toUpperCase(); // 예: krw-sol -> KRW-SOL
			webSocketClient.addSubscription(formatted);
			return ResponseEntity.ok("구독 완료: " + formatted);
		} catch (Exception e) {
			return ResponseEntity.status(500).body("오류: " + e.getMessage());
		}
	}
}
