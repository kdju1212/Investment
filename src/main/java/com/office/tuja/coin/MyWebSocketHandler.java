package com.office.tuja.coin;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class MyWebSocketHandler extends TextWebSocketHandler {
	@Override
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		System.out.println("클라이언트 접속됨: " + session.getId());
		System.out.println("URI: " + session.getUri());
		System.out.println("헤더: " + session.getHandshakeHeaders());
	}

	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
		System.out.println("메시지 수신: " + message.getPayload());
		session.sendMessage(new TextMessage("서버로부터 응답: " + message.getPayload()));
	}
}
