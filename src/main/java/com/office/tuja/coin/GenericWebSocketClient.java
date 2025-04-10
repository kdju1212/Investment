package com.office.tuja.coin;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.msgpack.jackson.dataformat.MessagePackFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketHttpHeaders;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;

@Component
public class GenericWebSocketClient extends BinaryWebSocketHandler {

	private final PriceStreamController controller;
	private final ObjectMapper msgpackMapper = new ObjectMapper(new MessagePackFactory());

	private final Set<String> subscribedMarkets = ConcurrentHashMap.newKeySet();
	private WebSocketSession session;

	public void addSubscription(String marketCode) {
		if (marketCode != null && !marketCode.isBlank()) {
			subscribedMarkets.add(marketCode.toUpperCase());
		}
		if (session != null && session.isOpen()) {
			try {
				String joined = String.join("\", \"", subscribedMarkets);
				String msg = String.format("[{\"ticket\":\"auto\"}, {\"type\":\"ticker\", \"codes\":[\"%s\"]}]",
						joined);
				session.sendMessage(new BinaryMessage(msg.getBytes(StandardCharsets.UTF_8)));

				System.out.println("🆕 구독 갱신: " + joined);
			} catch (Exception e) {
				e.printStackTrace();
			}
		} else {
			System.out.println("⚠️ WebSocket 세션이 아직 열려있지 않습니다.");
		}
	}

	public GenericWebSocketClient(PriceStreamController controller) {
		this.controller = controller;
	}

	@PostConstruct
	public void connect() {
		try {
			StandardWebSocketClient client = new StandardWebSocketClient();
			URI uri = new URI("wss://api.upbit.com/websocket/v1");
			WebSocketHttpHeaders headers = new WebSocketHttpHeaders(new HttpHeaders());
			client.doHandshake(this, headers, uri);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		this.session = session;

		System.out.println("✅ WebSocket 연결 완료");

		// 이미 등록된 구독 목록이 있다면 다시 전송 (재접속 대응용)
		if (!subscribedMarkets.isEmpty()) {
			addSubscription(""); // 빈 스트링을 넣어도 addSubscription 안에서 무시되므로 문제 없음
		}
	}

	@Override
	protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
		try {
			byte[] payload = message.getPayload().array();

			// 디버깅용: 수신된 바이너리를 Hex 형태로 출력
			// System.out.print("[받은 Binary 데이터]: ");
			for (byte b : payload) {
				// System.out.printf("%02X ", b);
			}
			// System.out.println();

			// 문자열로 변환 시도
			String json = new String(payload, "UTF-8");
			// System.out.println("[디코딩된 문자열]: " + json);

			// JSON → Map
			Map<String, Object> data = new ObjectMapper().readValue(json, Map.class);
			String code = (String) data.get("code");
			if (code != null && data.containsKey("trade_price")) {
				double tradePrice = ((Number) data.get("trade_price")).doubleValue();
				controller.sendPrice(code, tradePrice); // ✅ 여기서 JSON으로 감싸지 말고 값만 넘기기
			}

		} catch (Exception e) {
			System.out.println("[파싱 에러]: " + e.getMessage());
		}
	}

	@Override
	public void handleTransportError(WebSocketSession session, Throwable exception) {
		System.out.println("[WebSocket 오류]: " + exception.getMessage());
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
		System.out.println("[WebSocket 연결 종료]");
	}
}
