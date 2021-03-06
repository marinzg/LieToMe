CREATE TABLE [dbo].[Question](
	[questionID] [int] NOT NULL,
	[question] [nvarchar](max) NULL,
	[answer] [nvarchar](50) NULL,
 CONSTRAINT [PK_Question] PRIMARY KEY CLUSTERED 
(
	[questionID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (0, N'Leo Granit Kraft svjetski je prvak u neobičnom sportu koji je kombinacija boksa i _______ .', N'ŠAHA')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (1, N'Marcella Hazan usavršila je neobičan način pripreme patke pomoću _____.', N'SUŠILA ZA KOSU')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (2, N'U lipnju 2013. muškarac na Floridi osuđen je jer je prišao policajcu i udario _____.', N'NJEGOVOG KONJA')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (3, N'Za vrijeme vladavine Petra Velikog svaki plemić morao je platiti 100 rubalja godišnje kako bi dobio dozvolu za _____ .', N'BRADU')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (4, N'Električnu stolicu izumio je Alfred Southwick koji je po zanimanju bio _______ .', N'ZUBAR')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (5, N'Istraživanje objavljeno u znanstvenom časopisu Anthrozoo pokazalo je da krave proizvode 5% više mlijeka ukoliko im se da _______ .', N'IME')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (6, N'Ted Turner ima najveću svjetsku kolekciju _______ . Naime, posjeduje ih čak 55,000.', N'BIZONA')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (7, N'El Colacho je španjolski festival gdje se ljudi maskiraju i preskaču preko _______ .', N'BEBA')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (8, N'Originalno ime benda Queen je _______ .', N'SMILE')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (9, N'Srednje ime Michaela J. Foxa je _______ .', N'ANDREW')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (10, N'Tvrtka E21 radi vrlo neuobičajne štapove za pecanje koji su napravljeni od 70% _______ .', N'MRKVE')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (11, N'2014. američki državni tajnik John Kerry darovao je ruskom ministru vanjskih poslova Lavrowu neobičan dar: dva _______ .', N'VELIKA KRUMPIRA')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (12, N'Ben i Jerry počeli su proizvoditi sladoled samo zato jer je bilo preskupo proizvoditi ', N'PECIVA')
INSERT [dbo].[Question] ([questionID], [question], [answer]) VALUES (13, N'Anatidaefobija je strah da vas od nekud promatra _______ .', N'PATKA')
USE [master]
GO
ALTER DATABASE [LieToMeDB] SET  READ_WRITE 
GO
